import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../src/app/user/user.service';
import { PrismaModule } from '../src/db/prisma.module';
import { AuthModule } from '../src/app/auth/auth.module';
import { UserModule } from '../src/app/user/user.module';
import { INestApplication } from '@nestjs/common';
import { CreateUserDto } from '../src/app/user/dto/create-user.dto';
import { UserRepository } from '../src/app/user/repositories/user.repository';
import * as request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { UserTypeEnum } from '../src/app/user/entities/user.entity';

describe('UserController', () => {
  let app: INestApplication;
  let module: TestingModule;
  let data: CreateUserDto;
  let users: any;
  let usersTypes: any;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, UserModule],
      providers: [UserService, UserRepository],
    }).compile();

    app = module.createNestApplication();

    await app.init();

    data = {
      name: 'Teste usuário',
      email: 'emailteste@email.com',
      document: '12345678910',
      password: '123456',
    };
  });

  beforeEach(async () => {
    const prisma = new PrismaClient();

    users = await prisma.user.findMany();
    usersTypes = await prisma.userType.findMany();

    await prisma.$disconnect();
  });

  afterAll(async () => {
    await module.close();
  });

  describe('POST /login', () => {
    it('should login', async () => {
      const res = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: 'emailteste@email.com',
          password: '123456',
        })
        .expect(200);

      expect(res.body.token).toBeDefined();
      expect(res.body.type).toBeDefined();
    });

    it('should throw a NotFoundError on login', async () => {
      const res = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: 'wrongemail@email.com',
          password: '123456',
        })
        .expect(401);

      expect(res.body.message).toBe('Credenciais Inválidas.');
    });
  });

  describe('POST /users', () => {
    it('should create a user', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .send(data)
        .expect(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.created_at).toBeDefined();
      expect(res.body.user_type_id).toBeDefined();
      expect(res.body.name).toEqual(data.name);
      expect(res.body.email).toEqual(data.email);
      expect(res.body.document).toEqual(data.document);
    });
  });

  describe('GET /users', () => {
    it('should list all users', async () => {
      const res = await request(app.getHttpServer()).get('/users').expect(200);
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
  });

  describe('GET /users/:id', () => {
    it('should get an user by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${users[0].id}`)
        .expect(200);
      expect(res.body.id).toEqual(users[0].id);
      expect(res.body.name).toEqual(users[0].name);
      expect(res.body.document).toEqual(users[0].document);
    });
  });

  describe('GET /tickets', () => {
    it('should get all user tickets', async () => {
      const loginResponse = await request(app.getHttpServer()).post('/login').send({
        email: 'emailteste@email.com',
        password: '123456',
      });

      const res = await request(app.getHttpServer())
        .get(`/users/tickets/${users[0].id}`)
        .auth(loginResponse.body.token, { type: loginResponse.body.type })
        .expect(200);
      expect(res.body.content).toBeDefined();
      expect(res.body.totalRecords).toBeDefined();
    });
  });

  describe('GET /types', () => {
    it('should get all users types', async () => {
      const res = await request(app.getHttpServer()).get(`/users/types`).expect(200);
      expect(res.body[0].id).toEqual(usersTypes[0].id);
      expect(res.body[0].name).toEqual(usersTypes[0].name);
    });
  });

  describe('PATCH /users/:id', () => {
    const updateData = {
      name: 'New name',
      userTypeId: UserTypeEnum.ADMIN,
    };

    it('should update an user by id', async () => {
      const loginResponse = await request(app.getHttpServer()).post('/login').send({
        email: 'emailteste@email.com',
        password: '123456',
      });

      const res = await request(app.getHttpServer())
        .patch(`/users/${users[0].id}`)
        .auth(loginResponse.body.token, { type: loginResponse.body.type })
        .send(updateData)
        .expect(200);
      expect(res.body.id).toEqual(users[0].id);
      expect(res.body.name).toEqual(updateData.name);
      expect(res.body.user_type_id).toEqual(updateData.userTypeId);
      expect(res.body.document).toEqual(users[0].document);
      expect(res.body.active).toEqual(true);
    });

    it('should throw an UnauthorizedError', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${users[0].id}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('PATCH /:id/active', () => {
    it('should deactivate user', async () => {
      const loginResponse = await request(app.getHttpServer()).post('/login').send({
        email: 'emailteste@email.com',
        password: '123456',
      });

      const res = await request(app.getHttpServer())
        .patch(`/users/${users[0].id}/active`)
        .auth(loginResponse.body.token, { type: loginResponse.body.type })
        .expect(200);

      expect(res.body.message).toBe('Usuário desativado com sucesso.');
      expect(res.body.data.active).toEqual(false);
      expect(res.body.data.id).toEqual(users[0].id);
    });

    it('should activate user', async () => {
      const loginResponse = await request(app.getHttpServer()).post('/login').send({
        email: 'emailteste@email.com',
        password: '123456',
      });

      const res = await request(app.getHttpServer())
        .patch(`/users/${users[0].id}/active`)
        .auth(loginResponse.body.token, { type: loginResponse.body.type })
        .expect(200);

      expect(res.body.message).toBe('Usuário ativado com sucesso.');
      expect(res.body.data.active).toEqual(true);
      expect(res.body.data.id).toEqual(users[0].id);
    });

    it('should throw an UnauthorizedError', async () => {
      await request(app.getHttpServer()).patch(`/users/${users[0].id}`).expect(401);
    });
  });
});
