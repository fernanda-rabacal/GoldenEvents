import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../src/db/prisma.module.js';
import { setupApp } from '../src/setup-app.js';
import { AuthModule } from '../src/app/auth/auth.module.js';
import { UserModule } from '../src/app/user/user.module.js';
import { INestApplication } from '@nestjs/common';
import { CreateUserDto } from '../src/app/user/dto/create-user.dto.js';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { UserTypeEnum } from '../src/app/user/entities/user.entity.js';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { execSync } from 'child_process';

const ADMIN = { email: 'nandarabacal02@hotmail.com', password: '123456' };

describe('UserController', () => {
  let container: StartedPostgreSqlContainer;
  let app: INestApplication;
  let module: TestingModule;
  let data: CreateUserDto;
  let users: any;
  let usersTypes: any;

  const http = () => request(app.getHttpServer());

  async function startSession(
    credentials = { email: data.email, password: data.password },
    keepConnected = false,
  ) {
    const res = await http()
      .post('/login')
      .send({ ...credentials, keepConnected })
      .expect(200);

    return res.body as { token: string; refreshToken: string; keepConnected: boolean };
  }

  async function login(credentials = { email: data.email, password: data.password }) {
    return (await startSession(credentials)).token;
  }

  function refresh(refreshToken: string) {
    return http().post('/refresh').send({ refreshToken });
  }

  function decode(token: string) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
  }

  function testUser() {
    return users.find(user => user.email === data.email);
  }

  beforeAll(async () => {
    // banco isolado por execução; os testes abaixo dependem do estado deixado pelos anteriores
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    process.env.DATABASE_URL = container.getConnectionUri();

    execSync(`npx prisma migrate deploy`, { env: process.env });
    execSync(`npx prisma db seed`, { env: process.env });

    module = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, UserModule],
    }).compile();

    app = module.createNestApplication();
    setupApp(app);

    await app.init();

    data = {
      name: 'Teste usuário',
      email: 'emailteste@email.com',
      document: '12345678910',
      password: '12345678',
    };
  }, 60000);

  beforeEach(async () => {
    const prisma = new PrismaClient();

    users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
    usersTypes = await prisma.userType.findMany({ orderBy: { id: 'asc' } });

    await prisma.$disconnect();
  });

  afterAll(async () => {
    await module.close();
    await container.stop();
  });

  // Cria o usuário usado pelos testes seguintes, que fazem login com ele
  describe('POST /users', () => {
    it('should reject a password shorter than 8 characters', async () => {
      const res = await http()
        .post('/users')
        .send({ ...data, password: '1234567' })
        .expect(400);

      expect(res.body.message).toContain('A senha deve ter entre 8 e 72 caracteres.');
    });

    it('should create a user', async () => {
      const res = await http().post('/users').send(data).expect(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.created_at).toBeDefined();
      expect(res.body.user_type_id).toBeDefined();
      expect(res.body.name).toEqual(data.name);
      expect(res.body.email).toEqual(data.email);
      expect(res.body.document).toEqual(data.document);
      expect(res.body.password_changed_at).toBeUndefined();
    });
  });

  describe('POST /login', () => {
    it('should login with a 15 minutes access token and a refresh token', async () => {
      const res = await http()
        .post('/login')
        .send({ email: data.email, password: data.password })
        .expect(200);

      expect(res.body.type).toBe('bearer');
      expect(res.body.refreshToken).toEqual(expect.any(String));
      expect(res.body.keepConnected).toBe(false);

      const token = decode(res.body.token);
      expect(token.exp - token.iat).toBe(15 * 60);

      const kept = await startSession(undefined, true);
      const keptToken = decode(kept.token);
      expect(keptToken.exp - keptToken.iat).toBe(15 * 60);
      expect(kept.keepConnected).toBe(true);
    });

    it('should keep only the hash of the refresh token, expiring in 1 day or 30 days', async () => {
      const prisma = new PrismaClient();
      const before = Date.now();

      try {
        for (const [keepConnected, days] of [
          [false, 1],
          [true, 30],
        ] as const) {
          const { refreshToken } = await startSession(undefined, keepConnected);
          const [stored] = await prisma.refreshToken.findMany({
            where: { user_id: testUser().id },
            orderBy: { created_at: 'desc' },
            take: 1,
          });

          expect(stored.token_hash).not.toBe(refreshToken);
          expect(stored.keep_connected).toBe(keepConnected);
          expect(stored.expires_at.getTime() - before).toBeGreaterThanOrEqual(
            days * 86_400_000,
          );
          expect(stored.expires_at.getTime() - before).toBeLessThan(
            days * 86_400_000 + 60_000,
          );
        }
      } finally {
        await prisma.$disconnect();
      }
    });

    it('should send the helmet security headers', async () => {
      const res = await http()
        .post('/login')
        .send({ email: data.email, password: data.password });

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-powered-by']).toBeUndefined();
      // Em http (fora de produção), o upgrade para https quebraria o Swagger
      expect(res.headers['content-security-policy']).not.toContain(
        'upgrade-insecure-requests',
      );
    });

    it('should throw an UnauthorizedError on login with wrong password', async () => {
      const res = await http()
        .post('/login')
        .send({
          email: data.email,
          password: 'senha-errada',
        })
        .expect(401);

      expect(res.body.message).toBe('Credenciais Inválidas.');
    });

    it('should login with a seeded user', async () => {
      await login(ADMIN);
    });

    it('should throw a NotFoundError on login', async () => {
      const res = await http()
        .post('/login')
        .send({
          email: 'wrongemail@email.com',
          password: '123456',
        })
        .expect(401);

      expect(res.body.message).toBe('Credenciais Inválidas.');
    });
  });

  describe('POST /refresh', () => {
    it('should rotate the refresh token and return a working access token', async () => {
      const session = await startSession(undefined, true);

      const res = await refresh(session.refreshToken).expect(200);

      expect(res.body.refreshToken).not.toBe(session.refreshToken);
      expect(res.body.keepConnected).toBe(true);
      await http()
        .get('/users/token')
        .auth(res.body.token, { type: 'bearer' })
        .expect(200);
      await refresh(res.body.refreshToken).expect(200);
    });

    it('should reject an unknown refresh token', async () => {
      await refresh('nao-existe').expect(401);
      await http().post('/refresh').send({}).expect(400);
    });

    it('should end the whole session when an old refresh token is reused', async () => {
      const session = await startSession();
      const rotated = await refresh(session.refreshToken).expect(200);

      // Fora da tolerância para requisições paralelas
      const prisma = new PrismaClient();
      await prisma.refreshToken.updateMany({
        where: { rotated_at: { not: null } },
        data: { rotated_at: new Date(Date.now() - 60_000) },
      });
      await prisma.$disconnect();

      await refresh(session.refreshToken).expect(401);
      await refresh(rotated.body.refreshToken).expect(401);
    });

    it('should end the session on logout', async () => {
      const session = await startSession();

      await http()
        .post('/logout')
        .send({ refreshToken: session.refreshToken })
        .expect(204);

      await refresh(session.refreshToken).expect(401);
      await http().post('/logout').send({ refreshToken: 'nao-existe' }).expect(204);
    });
  });

  describe('GET /users', () => {
    it('should list all users to an admin', async () => {
      const token = await login(ADMIN);

      const res = await http().get('/users').auth(token, { type: 'bearer' }).expect(200);
      expect(res.body[0].id).toBeDefined();
      expect(res.body[0].name).toEqual(users[0].name);
      expect(res.body[0].email).toEqual(users[0].email);
      expect(res.body[0].created_at).toBeDefined();
      res.body.map(item =>
        expect(item).toEqual({
          id: item.id,
          name: item.name,
          email: item.email,
          document: item.document,
          active: true,
          created_at: item.created_at,
          updated_at: item.updated_at,
          user_type_id: item.user_type_id,
        }),
      );
    });

    it('should not list the users to anyone else', async () => {
      await http().get('/users').expect(401);
      const token = await login();

      await http().get('/users').auth(token, { type: 'bearer' }).expect(403);
    });
  });

  describe('GET /users/:id', () => {
    it('should get the own profile', async () => {
      const token = await login();

      const res = await http()
        .get(`/users/${testUser().id}`)
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(res.body.id).toEqual(testUser().id);
      expect(res.body.name).toEqual(testUser().name);
      expect(res.body.document).toEqual(testUser().document);
    });

    it('should not get the profile of another user', async () => {
      const token = await login();

      await http()
        .get(`/users/${users[0].id}`)
        .auth(token, { type: 'bearer' })
        .expect(403);
    });

    it('should throw an UnauthorizedError', async () => {
      await http().get(`/users/${users[0].id}`).expect(401);
    });
  });

  describe('GET /types', () => {
    it('should get all users types', async () => {
      const res = await http().get(`/users/types`).expect(200);
      expect(res.body[0].id).toEqual(usersTypes[0].id);
      expect(res.body[0].name).toEqual(usersTypes[0].name);
    });
  });

  describe('PATCH /users/:id', () => {
    const updateData = {
      name: 'New name',
      userTypeId: UserTypeEnum.ORGANIZER,
    };

    it('should update the own profile', async () => {
      const token = await login();

      const res = await http()
        .patch(`/users/${testUser().id}`)
        .auth(token, { type: 'bearer' })
        .send(updateData)
        .expect(200);
      expect(res.body.id).toEqual(testUser().id);
      expect(res.body.name).toEqual(updateData.name);
      expect(res.body.user_type_id).toEqual(updateData.userTypeId);
      expect(res.body.document).toEqual(testUser().document);
      expect(res.body.active).toEqual(true);
    });

    it('should not update another user', async () => {
      const token = await login();

      await http()
        .patch(`/users/${users[0].id}`)
        .auth(token, { type: 'bearer' })
        .send(updateData)
        .expect(403);
    });

    it('should not let an user promote himself to admin', async () => {
      const token = await login();

      await http()
        .patch(`/users/${testUser().id}`)
        .auth(token, { type: 'bearer' })
        .send({ userTypeId: UserTypeEnum.ADMIN })
        .expect(403);
    });

    it('should throw an UnauthorizedError', async () => {
      await http().patch(`/users/${users[0].id}`).send(updateData).expect(401);
    });
  });

  describe('PATCH /:id/active', () => {
    it('should not let someone who is not an admin deactivate an user', async () => {
      const token = await login();

      await http()
        .patch(`/users/${users[0].id}/active`)
        .auth(token, { type: 'bearer' })
        .expect(403);
    });

    it('should not let an admin deactivate their own account', async () => {
      const token = await login(ADMIN);

      await http()
        .patch(`/users/${users[0].id}/active`)
        .auth(token, { type: 'bearer' })
        .expect(422);
    });

    it('should deactivate user, and end their session at once', async () => {
      const { token: userToken, refreshToken } = await startSession();
      const adminToken = await login(ADMIN);

      const res = await http()
        .patch(`/users/${testUser().id}/active`)
        .auth(adminToken, { type: 'bearer' })
        .expect(200);

      expect(res.body.message).toBe('Usuário desativado com sucesso.');
      expect(res.body.data.active).toEqual(false);
      expect(res.body.data.id).toEqual(testUser().id);

      await http().get('/users/token').auth(userToken, { type: 'bearer' }).expect(401);
      await refresh(refreshToken).expect(401);
      await http()
        .post('/login')
        .send({ email: data.email, password: data.password })
        .expect(401);
    });

    it('should activate user', async () => {
      const token = await login(ADMIN);

      const res = await http()
        .patch(`/users/${testUser().id}/active`)
        .auth(token, { type: 'bearer' })
        .expect(200);

      expect(res.body.message).toBe('Usuário ativado com sucesso.');
      expect(res.body.data.active).toEqual(true);
      expect(res.body.data.id).toEqual(testUser().id);
      await login();
    });

    it('should throw an UnauthorizedError', async () => {
      await http().patch(`/users/${users[0].id}/active`).expect(401);
    });
  });

  // Por último: troca a senha do usuário de teste
  describe('Password change', () => {
    it('should require the current password', async () => {
      const token = await login();

      await http()
        .patch(`/users/${testUser().id}`)
        .auth(token, { type: 'bearer' })
        .send({ password: 'nova-senha-123' })
        .expect(400);

      const wrong = await http()
        .patch(`/users/${testUser().id}`)
        .auth(token, { type: 'bearer' })
        .send({ password: 'nova-senha-123', currentPassword: 'senha-errada' })
        .expect(422);

      expect(wrong.body.message).toBe('A senha atual está incorreta.');
    });

    it('should change the password and end the sessions started before it', async () => {
      const { token: oldToken, refreshToken } = await startSession(undefined, true);
      // iat tem precisão de segundos: o token antigo precisa ser de um segundo anterior
      await new Promise(resolve => setTimeout(resolve, 1100));

      await http()
        .patch(`/users/${testUser().id}`)
        .auth(oldToken, { type: 'bearer' })
        .send({ password: 'nova-senha-123', currentPassword: data.password })
        .expect(200);

      await http().get('/users/token').auth(oldToken, { type: 'bearer' }).expect(401);
      await refresh(refreshToken).expect(401);
      await http()
        .post('/login')
        .send({ email: data.email, password: data.password })
        .expect(401);

      const newToken = await login({ email: data.email, password: 'nova-senha-123' });
      await http().get('/users/token').auth(newToken, { type: 'bearer' }).expect(200);
    });
  });
});
