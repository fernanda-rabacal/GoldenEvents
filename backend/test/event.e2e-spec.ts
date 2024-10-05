import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { AuthModule } from '../src/app/auth/auth.module';
import { CategoryService } from '../src/app/event/category.service';
import { UpdateEventDto } from '../src/app/event/dto/update-event.dto';
import { EventModule } from '../src/app/event/event.module';
import { EventService } from '../src/app/event/event.service';
import { CategoryRepository } from '../src/app/event/repositories/categories.repository';
import { EventRepository } from '../src/app/event/repositories/events.repository';
import { UserModule } from '../src/app/user/user.module';
import { PrismaModule } from '../src/db/prisma.module';
import * as request from 'supertest';
import { MySqlContainer } from '@testcontainers/mysql';
import { execSync } from 'child_process';
import { createConnection } from 'mysql2/promise';

describe('UserController', () => {
  let container: any;
  let urlConnection: string;
  let client: any;
  let app: INestApplication;
  let module: TestingModule;
  let data: any;
  let prisma: PrismaClient;
  const currentDate: Date = new Date();

  beforeAll(async () => {
    container = await new MySqlContainer().start();

    client = await createConnection({
      host: container.getHost(),
      port: container.getPort(),
      database: container.getDatabase(),
      user: container.getUsername(),
      password: container.getUserPassword(),
    });

    process.env.DATABASE_URL = container.getConnectionUri();
    urlConnection = container.getConnectionUri();

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: urlConnection,
        },
      },
    });

    module = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, UserModule, EventModule],
      providers: [EventService, EventRepository, CategoryService, CategoryRepository],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    const newStartDate = new Date(),
      newEndDate = new Date();

    newStartDate.setMonth(currentDate.getMonth() + 1);
    newEndDate.setMonth(currentDate.getMonth() + 2);

    data = {
      name: 'Teste evento',
      description:
        'Teste de evento que precisa ter pelo menos 100 caracteres e pelo jeito ainda não tem, teste, teste, teste',
      location: 'Rua do limoeiro, 12',
      price: 10,
      capacity: 300,
      categoryId: 1,
      startDateTime: newStartDate.toISOString(),
      endDateTime: newEndDate.toISOString(),
    };
  }, 30000);

  beforeEach(async () => {
    // drop schema and create a new one
    execSync(`npx prisma migrate reset --force`, {
      env: {
        ...process.env,
        DATABASE_URL: urlConnection,
      },
    });
    execSync(`npx prisma migrate deploy`, {
      env: {
        ...process.env,
        DATABASE_URL: urlConnection,
      },
    });
    execSync(`npx prisma db seed`, {
      env: {
        ...process.env,
        DATABASE_URL: urlConnection,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await client.end();
    await container.stop();
    await module.close();
  });

  describe('POST /events', () => {
    it('should create a event', async () => {
      const loginResponse = await request(app.getHttpServer()).post('/login').send({
        email: 'nandarabacal02@hotmail.com',
        password: '123456',
      });

      const res = await request(app.getHttpServer())
        .post('/events')
        .auth(loginResponse.body.token, { type: loginResponse.body.type })
        .send(data)
        .expect(201);

      const eventDB = await prisma.event.findFirst({
        where: {
          slug: 'teste-evento',
        },
      });

      expect(eventDB).toBeTruthy();
      expect(eventDB.created_at).toBeDefined();
      expect(eventDB.active).toBeTruthy();
      expect(eventDB.slug).toBe('teste-evento');
      expect(eventDB.name).toEqual(data.name);
      expect(eventDB.description).toEqual(data.description);
      expect(eventDB.location).toEqual(data.location);
      expect(res.body.message).toEqual('Evento cadastrado com sucesso.');
    });
  });

  describe('GET /events', () => {
    it('should get all events', async () => {
      const loginResponse = await request(app.getHttpServer()).post('/login').send({
        email: 'nandarabacal02@hotmail.com',
        password: '123456',
      });

      await request(app.getHttpServer())
        .post('/events')
        .auth(loginResponse.body.token, { type: loginResponse.body.type })
        .send(data);

      const eventDB = await prisma.event.findFirst({
        where: {
          slug: 'teste-evento',
        },
      });

      const res = await request(app.getHttpServer()).get('/events');

      expect(res.body.content[0].id).toBeDefined();
      expect(res.body.content[0].name).toEqual(eventDB.name);
      expect(res.body.content[0].description).toEqual(eventDB.description);
      expect(res.body.content[0].created_at).toBeDefined();
      res.body.content.map(item =>
        expect(item).toEqual({
          id: item.id,
          name: item.name,
          description: item.description,
          location: item.location,
          capacity: item.capacity,
          created_at: item.created_at,
          updated_at: item.updated_at,
          active: true,
          category_id: item.category_id,
          end_date: item.end_date,
          photo: null,
          price: item.price,
          quantity_left: item.quantity_left,
          slug: 'teste-evento',
          start_date: item.start_date,
          user_id: item.user_id,
          category: {
            id: 1,
            name: 'Festas e Shows',
            photo: 'https://images.sympla.com.br/651596056d6be.png',
          },
        }),
      );
    });
  });

  describe('GET /events/:id', () => {
    it('should get an event by id', async () => {
      const loginResponse = await request(app.getHttpServer()).post('/login').send({
        email: 'nandarabacal02@hotmail.com',
        password: '123456',
      });

      await request(app.getHttpServer())
        .post('/events')
        .auth(loginResponse.body.token, { type: loginResponse.body.type })
        .send(data)
        .expect(201);

      const eventDB = await prisma.event.findFirst({
        where: {
          slug: 'teste-evento',
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/events/${eventDB.id}`)
        .expect(200);
      expect(res.body.id).toEqual(eventDB.id);
      expect(res.body.name).toEqual(eventDB.name);
      expect(res.body.description).toEqual(eventDB.description);
    });
  });

  describe('GET /events/:slug', () => {
    it('should get an event by a slug', async () => {
      const loginResponse = await request(app.getHttpServer()).post('/login').send({
        email: 'nandarabacal02@hotmail.com',
        password: '123456',
      });

      await request(app.getHttpServer())
        .post('/events')
        .auth(loginResponse.body.token, { type: loginResponse.body.type })
        .send(data);

      const eventDB = await prisma.event.findFirst({
        where: {
          slug: 'teste-evento',
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/events/slug/${eventDB.slug}`)
        .expect(200);
      expect(res.body.id).toEqual(eventDB.id);
      expect(res.body.name).toEqual(eventDB.name);
      expect(res.body.description).toEqual(eventDB.description);
    });
  });

  describe('PATCH /events/:id', () => {
    const startDateTime = new Date();
    const endDateTime = new Date();

    startDateTime.setMonth(startDateTime.getMonth() + 1);
    endDateTime.setMonth(endDateTime.getMonth() + 2);

    const updateData: UpdateEventDto = {
      name: 'New event name',
      description:
        'New description. That description should have more than 100 characters, but i must confess that i am a little impatient by this rule.',
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
    };

    it('should update an event by id', async () => {
      const loginResponse = await request(app.getHttpServer()).post('/login').send({
        email: 'nandarabacal02@hotmail.com',
        password: '123456',
      });

      await request(app.getHttpServer())
        .post('/events')
        .auth(loginResponse.body.token, { type: loginResponse.body.type })
        .send(data);

      const eventDB = await prisma.event.findMany();

      const res = await request(app.getHttpServer())
        .patch(`/events/${eventDB[0].id}`)
        .auth(loginResponse.body.token, { type: loginResponse.body.type })
        .send(updateData)
        .expect(200);

      expect(res.body.data.id).toEqual(eventDB[0].id);
      expect(res.body.data.location).toEqual(eventDB[0].location);
      expect(res.body.data.name).toEqual(updateData.name);
      expect(res.body.data.description).toEqual(updateData.description);
    });

    it('should throw an UnauthorizedError', async () => {
      await request(app.getHttpServer()).patch(`/events/1`).send(updateData).expect(401);
    });
  });
});
