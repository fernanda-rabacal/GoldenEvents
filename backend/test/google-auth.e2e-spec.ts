import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { mockDeep } from 'jest-mock-extended';
import { UserTypeEnum } from '@golden-events/shared';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import { PrismaModule } from '../src/db/prisma.module.js';
import { setupApp } from '../src/setup-app.js';
import { AuthModule } from '../src/app/auth/auth.module.js';
import { UserModule } from '../src/app/user/user.module.js';
import {
  GoogleIdentityClient,
  type GoogleProfile,
} from '../src/app/auth/google/google-identity.client.js';

describe('Google login', () => {
  let container: StartedPostgreSqlContainer;
  let app: INestApplication;
  let module: TestingModule;
  const google = mockDeep<GoogleIdentityClient>();

  const http = () => request(app.getHttpServer());

  function googleReturns(profile: Partial<GoogleProfile>) {
    google.exchangeCode.mockResolvedValueOnce({
      googleId: 'google-sub-novo',
      email: 'google@email.com',
      emailVerified: true,
      name: 'Pessoa Google',
      ...profile,
    });
  }

  function loginWithGoogle(keepConnected = false) {
    return http()
      .post('/login/google')
      .send({ code: 'code', codeVerifier: 'verifier', keepConnected })
      .expect(200);
  }

  function me(token: string) {
    return http().get('/users/token').set('Authorization', `Bearer ${token}`);
  }

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    process.env.DATABASE_URL = container.getConnectionUri();

    execSync(`npx prisma migrate deploy`, { env: process.env });
    execSync(`npx prisma db seed`, { env: process.env });

    module = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, UserModule],
    })
      .overrideProvider(GoogleIdentityClient)
      .useValue(google)
      .compile();

    app = module.createNestApplication();
    setupApp(app);

    await app.init();
  }, 60000);

  afterAll(async () => {
    await module.close();
    await container.stop();
  });

  it('should create an account only after the CPF is sent', async () => {
    googleReturns({});

    const first = await loginWithGoogle(true);

    expect(first.body).toEqual({
      signupRequired: true,
      signupToken: expect.any(String),
      name: 'Pessoa Google',
      email: 'google@email.com',
    });
    expect(first.body.token).toBeUndefined();

    await me(first.body.signupToken).expect(401);

    const signup = await http()
      .post('/signup/google')
      .send({
        signupToken: first.body.signupToken,
        document: '123.123.123-99',
        isOrganizer: true,
      })
      .expect(201);

    expect(signup.body.keepConnected).toBe(true);

    const profile = await me(signup.body.token).expect(200);

    expect(profile.body).toEqual(
      expect.objectContaining({
        email: 'google@email.com',
        document: '12312312399',
        user_type_id: UserTypeEnum.ORGANIZER,
      }),
    );
    expect(profile.body.google_id).toBeUndefined();
    expect(profile.body.password).toBeUndefined();
  });

  it('should log the same Google account in directly the next time', async () => {
    googleReturns({});

    const res = await loginWithGoogle();

    expect(res.body.token).toBeDefined();
    expect(res.body.signupRequired).toBeUndefined();
  });

  it('should refuse a password login on an account created with Google', async () => {
    await http()
      .post('/login')
      .send({ email: 'google@email.com', password: 'qualquer-senha' })
      .expect(401);
  });

  it('should link Google to an account created with a password', async () => {
    const password = { email: 'senha@email.com', password: '12345678' };

    await http()
      .post('/users')
      .send({ ...password, name: 'Pessoa Senha', document: '55566677788' })
      .expect(201);

    googleReturns({ googleId: 'google-sub-senha', email: 'Senha@Email.com' });

    const res = await loginWithGoogle();

    expect(res.body.token).toBeDefined();

    googleReturns({ googleId: 'google-sub-senha', email: 'outro-email@email.com' });
    await loginWithGoogle();

    await http().post('/login').send(password).expect(200);
  });

  it('should refuse a CPF that already has an account', async () => {
    googleReturns({ googleId: 'google-sub-cpf', email: 'cpf@email.com' });

    const first = await loginWithGoogle();

    const res = await http()
      .post('/signup/google')
      .send({ signupToken: first.body.signupToken, document: '12312312399' })
      .expect(409);

    expect(res.body.message).toBe('Já existe uma conta cadastrada com este CPF.');
  });

  it('should refuse an email Google has not verified', async () => {
    googleReturns({
      emailVerified: false,
      googleId: 'google-sub-x',
      email: 'x@email.com',
    });

    await http()
      .post('/login/google')
      .send({ code: 'code', codeVerifier: 'verifier' })
      .expect(401);
  });

  it('should refuse a tampered signup token', async () => {
    await http()
      .post('/signup/google')
      .send({ signupToken: 'nao-e-um-jwt', document: '99988877766' })
      .expect(401);
  });
});
