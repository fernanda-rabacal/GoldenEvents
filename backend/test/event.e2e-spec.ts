import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { AuthModule } from '../src/app/auth/auth.module.js';
import { CategoryService } from '../src/app/event/category.service.js';
import { UpdateEventDto } from '../src/app/event/dto/update-event.dto.js';
import { EventModule } from '../src/app/event/event.module.js';
import { EventService } from '../src/app/event/event.service.js';
import { CategoryRepository } from '../src/app/event/repositories/categories.repository.js';
import { EventRepository } from '../src/app/event/repositories/events.repository.js';
import { UserModule } from '../src/app/user/user.module.js';
import { PrismaModule } from '../src/db/prisma.module.js';
import { OutboxModule } from '../src/shared/outbox/outbox.module.js';
import { setupApp } from '../src/setup-app.js';
import request from 'supertest';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';

const ORGANIZER = { email: 'nandarabacal02@hotmail.com', password: '123456' };

describe('EventController', () => {
  let container: any;
  let urlConnection: string;
  let app: INestApplication;
  let module: TestingModule;
  let data: any;
  let prisma: PrismaClient;
  const currentDate: Date = new Date();

  async function login(credentials = ORGANIZER) {
    const { body } = await request(app.getHttpServer()).post('/login').send(credentials);

    return body.token as string;
  }

  async function createEvent(token: string) {
    await request(app.getHttpServer())
      .post('/events')
      .auth(token, { type: 'bearer' })
      .send(data)
      .expect(201);

    return prisma.event.findFirst({
      where: { slug: 'teste-evento' },
      include: {
        sectors: {
          orderBy: { position: 'asc' },
          include: { lots: { orderBy: { position: 'asc' } } },
        },
      },
    });
  }

  // A compra mora no módulo de vendas (payments.e2e-spec.ts); aqui só importa o estoque do lote
  function sellTickets(lotId: number, quantity: number) {
    return prisma.lot.update({
      where: { id: lotId },
      data: { quantity_left: { decrement: quantity } },
    });
  }

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();

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
      imports: [PrismaModule, OutboxModule, AuthModule, UserModule, EventModule],
      providers: [EventService, EventRepository, CategoryService, CategoryRepository],
    }).compile();

    app = module.createNestApplication();
    setupApp(app);

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
      categoryId: 1,
      startDateTime: newStartDate.toISOString(),
      endDateTime: newEndDate.toISOString(),
      sectors: [
        {
          name: 'Pista',
          lots: [
            { name: '1º lote', price: 4500, quantity: 2 },
            { name: '2º lote', price: 6000, quantity: 100 },
          ],
        },
        { name: 'Camarote', lots: [{ name: 'Lote único', price: 15000, quantity: 50 }] },
      ],
    };
  }, 30000);

  beforeEach(async () => {
    // o reset já aplica as migrations e roda o seed
    execSync(`npx prisma migrate reset --force`, {
      env: {
        ...process.env,
        DATABASE_URL: urlConnection,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
    await module.close();
  });

  describe('POST /events', () => {
    it('should create a event', async () => {
      const token = await login();

      const res = await request(app.getHttpServer())
        .post('/events')
        .auth(token, { type: 'bearer' })
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

    it('should create the sectors and lots with the event totals', async () => {
      const event = await createEvent(await login());

      expect(event.capacity).toBe(152);
      expect(event.quantity_left).toBe(152);
      expect(event.min_price).toBe(4500);
      expect(event.sectors.map(({ name }) => name)).toEqual(['Pista', 'Camarote']);
      expect(event.sectors[0].lots).toEqual([
        expect.objectContaining({
          name: '1º lote',
          price: 4500,
          quantity: 2,
          quantity_left: 2,
          position: 0,
        }),
        expect.objectContaining({ name: '2º lote', price: 6000, position: 1 }),
      ]);
    });

    it.each([
      ['without sectors', []],
      [
        'with a price in reais',
        [{ name: 'Pista', lots: [{ name: 'Lote', price: 45.5, quantity: 1 }] }],
      ],
    ])('should reject an event %s', async (_, sectors) => {
      const token = await login();

      const res = await request(app.getHttpServer())
        .post('/events')
        .auth(token, { type: 'bearer' })
        .send({ ...data, sectors })
        .expect(400);

      expect(res.body.message).toBeDefined();
      expect(await prisma.event.count()).toBe(0);
    });
  });

  describe('GET /events', () => {
    it('should get all events', async () => {
      const eventDB = await createEvent(await login());

      const res = await request(app.getHttpServer()).get('/events');

      expect(res.body.content[0].id).toBeDefined();
      expect(res.body.content[0].name).toEqual(eventDB.name);
      expect(res.body.content[0].description).toEqual(eventDB.description);
      expect(res.body.content[0].created_at).toBeDefined();
      res.body.content.map(item =>
        expect(item).toEqual({
          id: item.id,
          name: item.name,
          subtitle: null,
          description: item.description,
          location: item.location,
          capacity: 152,
          created_at: item.created_at,
          updated_at: item.updated_at,
          active: true,
          category_id: item.category_id,
          end_date: item.end_date,
          photo: null,
          min_price: 4500,
          quantity_left: 152,
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
      const eventDB = await createEvent(await login());

      const res = await request(app.getHttpServer())
        .get(`/events/${eventDB.id}`)
        .expect(200);
      expect(res.body.id).toEqual(eventDB.id);
      expect(res.body.name).toEqual(eventDB.name);
      expect(res.body.description).toEqual(eventDB.description);
    });

    it('should return 404 for an event that does not exist', async () => {
      const res = await request(app.getHttpServer()).get('/events/999999').expect(404);

      expect(res.body.message).toEqual('Evento não encontrado');
    });
  });

  describe('GET /events/:slug', () => {
    it('should get an event by a slug with its sectors and lots in order', async () => {
      const eventDB = await createEvent(await login());

      const res = await request(app.getHttpServer())
        .get(`/events/slug/${eventDB.slug}`)
        .expect(200);
      expect(res.body.id).toEqual(eventDB.id);
      expect(res.body.name).toEqual(eventDB.name);
      expect(res.body.description).toEqual(eventDB.description);
      expect(res.body.sectors.map(({ name }) => name)).toEqual(['Pista', 'Camarote']);
      expect(res.body.sectors[0].lots.map(({ name }) => name)).toEqual([
        '1º lote',
        '2º lote',
      ]);
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
      const token = await login();
      const eventDB = await createEvent(token);

      const res = await request(app.getHttpServer())
        .patch(`/events/${eventDB.id}`)
        .auth(token, { type: 'bearer' })
        .send(updateData)
        .expect(200);

      expect(res.body.data.id).toEqual(eventDB.id);
      expect(res.body.data.location).toEqual(eventDB.location);
      expect(res.body.data.name).toEqual(updateData.name);
      expect(res.body.data.description).toEqual(updateData.description);
      expect(res.body.data.sectors).toHaveLength(2);
    });

    it('should update, create and remove sectors and lots', async () => {
      const token = await login();
      const eventDB = await createEvent(token);
      const [pista] = eventDB.sectors;

      await sellTickets(pista.lots[0].id, 1);

      const res = await request(app.getHttpServer())
        .patch(`/events/${eventDB.id}`)
        .auth(token, { type: 'bearer' })
        .send({
          sectors: [
            {
              id: pista.id,
              name: 'Pista Premium',
              lots: [
                { id: pista.lots[0].id, name: '1º lote', price: 4500, quantity: 5 },
                { name: '3º lote', price: 9000, quantity: 10 },
              ],
            },
            {
              name: 'Backstage',
              lots: [{ name: 'Lote único', price: 30000, quantity: 3 }],
            },
          ],
        })
        .expect(200);

      expect(res.body.data.sectors.map(({ name }) => name)).toEqual([
        'Pista Premium',
        'Backstage',
      ]);
      expect(res.body.data.sectors[0].lots).toEqual([
        expect.objectContaining({ id: pista.lots[0].id, quantity: 5, quantity_left: 4 }),
        expect.objectContaining({ name: '3º lote', quantity: 10, quantity_left: 10 }),
      ]);
      expect(res.body.data).toEqual(
        expect.objectContaining({ capacity: 18, quantity_left: 17, min_price: 4500 }),
      );
      expect(await prisma.sector.count()).toBe(2);
      expect(await prisma.lot.count()).toBe(3);
    });

    it('should not remove a lot that already sold tickets', async () => {
      const token = await login();
      const eventDB = await createEvent(token);
      const [pista, camarote] = eventDB.sectors;

      await sellTickets(pista.lots[0].id, 1);

      const res = await request(app.getHttpServer())
        .patch(`/events/${eventDB.id}`)
        .auth(token, { type: 'bearer' })
        .send({
          sectors: [
            {
              id: camarote.id,
              name: camarote.name,
              lots: [
                {
                  id: camarote.lots[0].id,
                  name: 'Lote único',
                  price: 15000,
                  quantity: 50,
                },
              ],
            },
          ],
        })
        .expect(422);

      expect(res.body.message).toEqual(
        'O lote "1º lote" já tem ingressos vendidos e não pode ser removido.',
      );
      expect(await prisma.lot.count()).toBe(3);
    });

    it('should throw an UnauthorizedError', async () => {
      await request(app.getHttpServer()).patch(`/events/1`).send(updateData).expect(401);
    });
  });
});
