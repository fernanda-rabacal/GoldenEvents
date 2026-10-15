import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import { Redis } from 'ioredis';
import request from 'supertest';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import { AuthModule } from '../src/app/auth/auth.module.js';
import { BillingModule } from '../src/app/billing/index.js';
import { FAKE_DECLINED_CARD_TOKEN } from '../src/app/billing/infra/gateways/fake.gateway.js';
import { EventModule } from '../src/app/event/event.module.js';
import { SalesModule } from '../src/app/sales/index.js';
import { UserModule } from '../src/app/user/user.module.js';
import { PrismaModule } from '../src/db/prisma.module.js';
import { setupApp } from '../src/setup-app.js';

const ORGANIZER = { email: 'nandarabacal02@hotmail.com', password: '123456' };
const BUYER = { email: 'mayan@hotmail.com', password: '123456' };
const OTHER_BUYER = { email: 'davi@hotmail.com', password: '123456' };
const INTERNAL_KEY = 'chave-interna-dos-testes-de-limite';

describe('Rate limit', () => {
  let postgres: any;
  let redisContainer: StartedTestContainer;
  let redis: Redis;
  let app: INestApplication;

  const http = () => request(app.getHttpServer());

  // Como o servidor do Next faz: o IP do navegador vai com a chave interna
  function asNext(test: request.Test, ip: string) {
    return test.set('X-Internal-Key', INTERNAL_KEY).set('X-Client-IP', ip);
  }

  function loginFrom(ip: string, credentials: { email: string; password: string }) {
    return asNext(http().post('/login'), ip).send(credentials);
  }

  async function token(credentials = BUYER) {
    const { body } = await loginFrom('192.0.2.1', credentials).expect(200);

    return body.token as string;
  }

  async function createLot() {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() + 1);

    const organizer = await token(ORGANIZER);
    const { body } = await http()
      .post('/events')
      .auth(organizer, { type: 'bearer' })
      .send({
        name: `Evento ${Math.random()}`,
        description:
          'Evento de teste do limite de requisições, com uma descrição de pelo menos cem caracteres para a validação.',
        location: 'Rua do limoeiro, 12',
        categoryId: 1,
        startDateTime: startDate.toISOString(),
        sectors: [{ name: 'Pista', lots: [{ name: 'Lote', price: 4500, quantity: 20 }] }],
      })
      .expect(201);

    return body.data.sectors[0].lots[0].id as number;
  }

  function createOrder(buyer: string, lotId: number) {
    return http()
      .post('/orders')
      .auth(buyer, { type: 'bearer' })
      .send({ items: [{ lotId, quantity: 1 }] });
  }

  function expectTooManyRequests(res: request.Response) {
    expect(res.status).toBe(429);
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
    expect(res.body.message).toContain('Tente novamente em');
  }

  beforeAll(async () => {
    [postgres, redisContainer] = await Promise.all([
      new PostgreSqlContainer('postgres:16-alpine').start(),
      new GenericContainer('redis:7-alpine').withExposedPorts(6379).start(),
    ]);

    process.env.DATABASE_URL = postgres.getConnectionUri();
    process.env.REDIS_URL = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;
    process.env.RATE_LIMIT = 'on';
    process.env.QUEUE_WORKERS = 'off';
    process.env.INTERNAL_API_KEY = INTERNAL_KEY;

    redis = new Redis(process.env.REDIS_URL);

    execSync(`npx prisma migrate reset --force`, { env: process.env });

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        AuthModule,
        UserModule,
        EventModule,
        SalesModule,
        BillingModule,
      ],
    }).compile();

    app = module.createNestApplication({ rawBody: true });
    setupApp(app);
    await app.init();
  }, 120_000);

  beforeEach(async () => {
    await redis.flushall();
  });

  afterAll(async () => {
    await app.close();
    await redis.quit();
    await Promise.all([postgres.stop(), redisContainer.stop()]);
  });

  describe('Login', () => {
    it('should block an email after 5 wrong passwords, even with the right one', async () => {
      for (let i = 0; i < 5; i++) {
        await loginFrom(`203.0.113.${i}`, { ...BUYER, password: 'errada' }).expect(401);
      }

      expectTooManyRequests(await loginFrom('203.0.113.9', BUYER));
      await loginFrom('203.0.113.9', OTHER_BUYER).expect(200);
    });

    it('should forget the wrong passwords after a successful login', async () => {
      for (let round = 0; round < 2; round++) {
        for (let i = 0; i < 4; i++) {
          await loginFrom('203.0.113.1', { ...BUYER, password: 'errada' }).expect(401);
        }

        await loginFrom('203.0.113.1', BUYER).expect(200);
      }
    });

    it('should limit the attempts of one IP and tell IPs apart', async () => {
      for (let i = 0; i < 20; i++) {
        await loginFrom('203.0.113.50', {
          email: `ninguem-${i}@teste.com`,
          password: 'x',
        }).expect(401);
      }

      expectTooManyRequests(await loginFrom('203.0.113.50', BUYER));
      await loginFrom('203.0.113.51', BUYER).expect(200);
    });

    it('should ignore the IP sent without the internal key', async () => {
      for (let i = 0; i < 20; i++) {
        await http()
          .post('/login')
          .set('X-Internal-Key', 'chave-errada')
          .set('X-Client-IP', `203.0.113.${100 + i}`)
          .send({ email: `ninguem-${i}@teste.com`, password: 'x' })
          .expect(401);
      }

      expectTooManyRequests(
        await http().post('/login').set('X-Client-IP', '203.0.113.200').send(BUYER),
      );
    });
  });

  it('should limit the signups of one IP', async () => {
    const signup = (i: number) =>
      asNext(http().post('/users'), '198.51.100.7').send({
        name: `Pessoa ${i}`,
        email: `cadastro-${i}@teste.com`,
        password: '12345678',
        document: `8${String(i).padStart(10, '0')}`,
      });

    for (let i = 0; i < 10; i++) {
      await signup(i).expect(201);
    }

    expectTooManyRequests(await signup(10));
  });

  it('should count every order attempt of a user, refused ones included', async () => {
    const lotId = await createLot();
    const buyer = await token();

    await createOrder(buyer, lotId).expect(201);

    // Pedido em aberto: a regra de negócio recusa, e o limite conta a tentativa mesmo assim
    for (let i = 0; i < 9; i++) {
      await createOrder(buyer, lotId).expect(422);
    }

    expectTooManyRequests(await createOrder(buyer, lotId));
    await createOrder(await token(OTHER_BUYER), lotId).expect(201);
  });

  it('should refuse cards after 5 declines and still accept Pix', async () => {
    const lotId = await createLot();
    const buyer = await token();
    const { body } = await createOrder(buyer, lotId).expect(201);
    const pay = (payment: object) =>
      http()
        .post(`/orders/${body.data.id}/pay`)
        .auth(buyer, { type: 'bearer' })
        .send(payment);

    for (let i = 0; i < 5; i++) {
      await pay({ method: 'card', paymentToken: FAKE_DECLINED_CARD_TOKEN }).expect(422);
    }

    expectTooManyRequests(await pay({ method: 'card', paymentToken: 'tok_visa' }));

    const pix = await pay({ method: 'pix' }).expect(201);
    expect(pix.body.data.status).toBe('pending');
  });

  it('should never rate limit the payment provider webhooks', async () => {
    for (let i = 0; i < 50; i++) {
      await http()
        .post('/webhooks/fake')
        .set('x-fake-signature', 'invalida')
        .send({ id: `evt_${i}` })
        .expect(401);
    }
  });
});
