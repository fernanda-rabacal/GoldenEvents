import { UserTypeEnum } from '@golden-events/shared';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, type TicketStatus } from '@prisma/client';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import { Redis } from 'ioredis';
import request from 'supertest';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import { AuthModule } from '../src/app/auth/auth.module.js';
import { BillingModule } from '../src/app/billing/index.js';
import {
  FAKE_DECLINED_CARD_TOKEN,
  FakeGateway,
} from '../src/app/billing/infra/gateways/fake.gateway.js';
import { EventModule } from '../src/app/event/event.module.js';
import { EVENT_CANCELLED } from '../src/app/event/event.events.js';
import { EventCancellationConsumer } from '../src/app/sales/application/event-cancellation.consumer.js';
import { OrderExpirationService } from '../src/app/sales/application/order-expiration.service.js';
import { OPEN_ORDER_EXISTS } from '../src/app/sales/domain/purchase-policy.js';
import { SalesModule } from '../src/app/sales/index.js';
import { UserModule } from '../src/app/user/user.module.js';
import { PrismaModule } from '../src/db/prisma.module.js';
import { setupApp } from '../src/setup-app.js';
import { MaintenanceService } from '../src/shared/messaging/maintenance.service.js';
import { QUEUES, QueueService } from '../src/shared/queue/queue.service.js';

const ORGANIZER = { email: 'nandarabacal02@hotmail.com', password: '123456' };
const BUYER = { email: 'mayan@hotmail.com', password: '123456' };
const OTHER_BUYER = { email: 'davi@hotmail.com', password: '123456' };

const CARD = { method: 'card', paymentToken: 'tok_visa' };
const PIX = { method: 'pix' };

describe('Payments (phase 1)', () => {
  let postgres: any;
  let redisContainer: StartedTestContainer;
  let redis: Redis;
  let urlConnection: string;
  let app: INestApplication;
  let module: TestingModule;
  let prisma: PrismaClient;
  let fake: FakeGateway;

  const http = () => request(app.getHttpServer());

  async function login(credentials = BUYER) {
    const { body } = await http().post('/login').send(credentials);

    return body.token as string;
  }

  // Um setor com um lote por padrão; a compra é sempre do lote da vez
  async function createEvent(lots = [{ name: 'Lote único', price: 4500, quantity: 2 }]) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() + 1);

    // Login antes de montar a requisição: o supertest fecha o servidor compartilhado
    // quando uma requisição termina no meio da montagem de outra
    const token = await login(ORGANIZER);
    const { body } = await http()
      .post('/events')
      .auth(token, { type: 'bearer' })
      .send({
        name: `Evento ${Math.random()}`,
        description:
          'Evento de teste dos pagamentos, com uma descrição de pelo menos cem caracteres para passar na validação.',
        location: 'Rua do limoeiro, 12',
        categoryId: 1,
        startDateTime: startDate.toISOString(),
        sectors: [{ name: 'Pista', lots }],
      })
      .expect(201);

    return {
      eventId: body.data.id as number,
      lotId: body.data.sectors[0].lots[0].id as number,
    };
  }

  function createOrder(token: string, lotId: number, quantity = 2) {
    return http()
      .post('/orders')
      .auth(token, { type: 'bearer' })
      .send({ items: [{ lotId, quantity }] });
  }

  function pay(token: string, orderId: string, body: object) {
    return http()
      .post(`/orders/${orderId}/pay`)
      .auth(token, { type: 'bearer' })
      .send(body);
  }

  async function paidOrder(token: string, lotId: number, quantity = 2) {
    const { body } = await createOrder(token, lotId, quantity).expect(201);

    await pay(token, body.data.id, CARD).expect(201);
    await waitForOrder(body.data.id, 'paid');

    return body.data.id as string;
  }

  function sendWebhook(webhook: { rawBody: Buffer; headers: Record<string, string> }) {
    return http()
      .post('/webhooks/fake')
      .set(webhook.headers)
      .set('Content-Type', 'application/json')
      .send(webhook.rawBody.toString());
  }

  async function providerChargeId(chargeId: string) {
    const charge = await prisma.charge.findUniqueOrThrow({ where: { id: chargeId } });

    return charge.provider_charge_id;
  }

  // O pagamento é confirmado de forma assíncrona (webhook -> fila -> outbox -> consumidor)
  async function waitFor<T>(check: () => Promise<T>, timeoutMs = 15_000) {
    const deadline = Date.now() + timeoutMs;

    for (;;) {
      const result = await check();

      if (result) {
        return result;
      }

      if (Date.now() > deadline) {
        throw new Error('A condição esperada não aconteceu a tempo.');
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  function waitForOrder(orderId: string, status: string) {
    return waitFor(async () => {
      const order = await prisma.order.findUnique({ where: { id: orderId } });

      return order?.status === status ? order : null;
    });
  }

  async function expireNow(orderId: string) {
    await prisma.order.update({
      where: { id: orderId },
      data: { expires_at: new Date(Date.now() - 1_000) },
    });
    await module.get(OrderExpirationService).expire(orderId);
  }

  function countTickets(orderId: string, status: TicketStatus = 'valid') {
    return prisma.ticket.count({ where: { order_item: { order_id: orderId }, status } });
  }

  async function lotLeft(lotId: number) {
    const lot = await prisma.lot.findUniqueOrThrow({ where: { id: lotId } });

    return lot.quantity_left;
  }

  beforeAll(async () => {
    [postgres, redisContainer] = await Promise.all([
      new PostgreSqlContainer('postgres:16-alpine').start(),
      new GenericContainer('redis:7-alpine').withExposedPorts(6379).start(),
    ]);

    urlConnection = postgres.getConnectionUri();
    process.env.DATABASE_URL = urlConnection;
    process.env.REDIS_URL = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;
    process.env.OUTBOX_POLL_INTERVAL_MS = '100';

    redis = new Redis(process.env.REDIS_URL);
    prisma = new PrismaClient({ datasources: { db: { url: urlConnection } } });

    execSync(`npx prisma migrate reset --force`, {
      env: { ...process.env, DATABASE_URL: urlConnection },
    });

    module = await Test.createTestingModule({
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

    fake = module.get(FakeGateway);
  }, 120_000);

  beforeEach(async () => {
    // o reset já aplica as migrations e roda o seed
    execSync(`npx prisma migrate reset --force`, {
      env: { ...process.env, DATABASE_URL: urlConnection },
    });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
    await redis.quit();
    await Promise.all([postgres.stop(), redisContainer.stop()]);
  });

  describe('Pix', () => {
    it('should reserve the tickets and issue them when the Pix is paid', async () => {
      const { eventId, lotId } = await createEvent();
      const token = await login();

      const created = await createOrder(token, lotId).expect(201);
      const orderId = created.body.data.id;

      expect(created.body.data).toEqual(
        expect.objectContaining({
          status: 'awaiting_payment',
          subtotal_cents: 9000,
          total_cents: 9000,
        }),
      );
      expect(await lotLeft(lotId)).toBe(0);
      expect(await prisma.event.findUnique({ where: { id: eventId } })).toEqual(
        expect.objectContaining({ quantity_left: 0 }),
      );

      const charge = await pay(token, orderId, PIX).expect(201);

      expect(charge.body.data).toEqual(
        expect.objectContaining({ method: 'pix', status: 'pending' }),
      );
      expect(charge.body.data.pix_qr_code).toBeTruthy();

      // Pedir o Pix de novo devolve o mesmo QR, sem criar outra cobrança
      const again = await pay(token, orderId, PIX).expect(201);
      expect(again.body.data.id).toBe(charge.body.data.id);

      await http().post(`/fake-gateway/charges/${charge.body.data.id}/pay`).expect(200);
      await waitForOrder(orderId, 'paid');

      const order = await http()
        .get(`/orders/${orderId}`)
        .auth(token, { type: 'bearer' })
        .expect(200);
      const tickets = order.body.items[0].tickets;

      expect(tickets).toHaveLength(2);
      expect(new Set(tickets.map(({ code }) => code)).size).toBe(2);
      expect(order.body.charges).toEqual([
        expect.objectContaining({ status: 'succeeded', amount_cents: 9000 }),
      ]);

      const myTickets = await http()
        .get('/users/me/tickets')
        .auth(token, { type: 'bearer' })
        .expect(200);

      expect(myTickets.body[0].tickets[0]).toEqual(
        expect.objectContaining({ status: 'valid', code: tickets[0].code }),
      );
    });

    it('should process the same webhook delivered 3 times only once', async () => {
      const { lotId } = await createEvent();
      const token = await login();
      const { body } = await createOrder(token, lotId).expect(201);
      const charge = await pay(token, body.data.id, PIX).expect(201);

      const webhook = fake.simulatePixPayment(
        await providerChargeId(charge.body.data.id),
      );

      for (let i = 0; i < 3; i++) {
        await sendWebhook(webhook).expect(200);
      }

      await waitForOrder(body.data.id, 'paid');
      // Mais uma volta do outbox, para pegar uma confirmação duplicada se ela existisse
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(await prisma.webhookEvent.count()).toBe(1);
      expect(await countTickets(body.data.id)).toBe(2);
      expect(
        await prisma.outboxMessage.count({ where: { event_type: 'sales.order_paid' } }),
      ).toBe(1);
    });

    it('should end paid when an old event arrives after the payment', async () => {
      const { lotId } = await createEvent();
      const token = await login();
      const { body } = await createOrder(token, lotId).expect(201);
      const charge = await pay(token, body.data.id, PIX).expect(201);
      const providerId = await providerChargeId(charge.body.data.id);

      await sendWebhook(fake.simulatePixPayment(providerId)).expect(200);
      // "Autorizado" chegando depois do "pago": o worker consulta o provedor e não volta o status
      await sendWebhook(
        fake.signedWebhook('charge.authorized', 'charge', providerId),
      ).expect(200);

      await waitForOrder(body.data.id, 'paid');
      await waitFor(async () =>
        (await prisma.webhookEvent.findMany()).every(({ processed_at }) => processed_at),
      );

      expect(
        await prisma.charge.findUnique({ where: { id: charge.body.data.id } }),
      ).toEqual(expect.objectContaining({ status: 'succeeded' }));
      expect(
        await prisma.webhookEvent.count({ where: { last_error: { not: null } } }),
      ).toBe(0);
    });

    it('should refund a Pix paid after the order expired when the tickets sold out', async () => {
      const { lotId } = await createEvent();
      const token = await login();
      const late = await createOrder(token, lotId).expect(201);
      const lateOrderId = late.body.data.id;
      const charge = await pay(token, lateOrderId, PIX).expect(201);

      await expireNow(lateOrderId);

      expect(await prisma.order.findUnique({ where: { id: lateOrderId } })).toEqual(
        expect.objectContaining({ status: 'expired' }),
      );
      expect(
        await prisma.charge.findUnique({ where: { id: charge.body.data.id } }),
      ).toEqual(expect.objectContaining({ status: 'cancelled' }));
      expect(await lotLeft(lotId)).toBe(2);

      // Outra pessoa compra o estoque liberado
      await paidOrder(await login(OTHER_BUYER), lotId);

      // O Pix que já estava a caminho chega depois da expiração
      await http().post(`/fake-gateway/charges/${charge.body.data.id}/pay`).expect(200);

      const refund = await waitFor(() =>
        prisma.refund.findFirst({
          where: { charge_id: charge.body.data.id, status: 'succeeded' },
        }),
      );

      expect(refund).toEqual(
        expect.objectContaining({ reason: 'late_payment', amount_cents: 9000 }),
      );
      expect(await prisma.order.findUnique({ where: { id: lateOrderId } })).toEqual(
        expect.objectContaining({ status: 'expired' }),
      );
      expect(await countTickets(lateOrderId)).toBe(0);
      expect(await lotLeft(lotId)).toBe(0);
    });

    it('should deliver a Pix paid after the order expired when there is still stock', async () => {
      const { lotId } = await createEvent();
      const token = await login();
      const { body } = await createOrder(token, lotId).expect(201);
      const charge = await pay(token, body.data.id, PIX).expect(201);

      await expireNow(body.data.id);
      await http().post(`/fake-gateway/charges/${charge.body.data.id}/pay`).expect(200);

      await waitForOrder(body.data.id, 'paid');

      expect(await countTickets(body.data.id)).toBe(2);
      expect(await lotLeft(lotId)).toBe(0);
      expect(await prisma.refund.count()).toBe(0);
    });
  });

  describe('Card', () => {
    it('should approve a card and confirm the order', async () => {
      const { lotId } = await createEvent();
      const token = await login();
      const { body } = await createOrder(token, lotId).expect(201);

      const charge = await pay(token, body.data.id, CARD).expect(201);

      expect(charge.body.data.status).toBe('succeeded');
      await waitForOrder(body.data.id, 'paid');
      expect(await countTickets(body.data.id)).toBe(2);

      await pay(token, body.data.id, CARD).expect(409);
    });

    it('should record a declined card and accept a new attempt', async () => {
      const { lotId } = await createEvent();
      const token = await login();
      const { body } = await createOrder(token, lotId).expect(201);

      const declined = await pay(token, body.data.id, {
        method: 'card',
        paymentToken: FAKE_DECLINED_CARD_TOKEN,
      }).expect(422);

      expect(declined.body.message).toContain('Pagamento recusado');

      await pay(token, body.data.id, CARD).expect(201);
      await waitForOrder(body.data.id, 'paid');

      const charges = await prisma.charge.findMany({ orderBy: { created_at: 'asc' } });

      expect(
        charges.map(({ status, idempotency_key }) => [status, idempotency_key]),
      ).toEqual([
        ['failed', `charge:order:${body.data.id}:1`],
        ['succeeded', `charge:order:${body.data.id}:2`],
      ]);
    });

    it('should refund a duplicate payment when the buyer switched from Pix to card', async () => {
      const { lotId } = await createEvent();
      const token = await login();
      const { body } = await createOrder(token, lotId).expect(201);
      const pix = await pay(token, body.data.id, PIX).expect(201);
      const providerId = await providerChargeId(pix.body.data.id);

      await pay(token, body.data.id, CARD).expect(201);
      await waitForOrder(body.data.id, 'paid');

      // O banco liquidou o Pix antigo mesmo depois do cancelamento
      await sendWebhook(fake.simulatePixPayment(providerId)).expect(200);

      const refund = await waitFor(() =>
        prisma.refund.findFirst({
          where: { charge_id: pix.body.data.id, status: 'succeeded' },
        }),
      );

      expect(refund.reason).toBe('duplicate');
      expect(await countTickets(body.data.id)).toBe(2);
    });
  });

  describe('Orders', () => {
    it('should issue free tickets without a charge', async () => {
      const { lotId } = await createEvent([{ name: 'Gratuito', price: 0, quantity: 5 }]);
      const token = await login();

      const { body } = await createOrder(token, lotId, 3).expect(201);

      expect(body.data.status).toBe('paid');
      expect(body.data.items[0].tickets).toHaveLength(3);
      expect(await prisma.charge.count()).toBe(0);
      await pay(token, body.data.id, PIX).expect(409);
    });

    it('should limit the tickets of one buyer per event, paid ones included', async () => {
      const { lotId } = await createEvent([{ name: 'Lote', price: 4500, quantity: 30 }]);
      const token = await login();

      await paidOrder(token, lotId, 8);

      const res = await createOrder(token, lotId, 3).expect(422);
      expect(res.body.message).toBe(
        'Cada pessoa pode comprar no máximo 10 ingressos por evento. Você já tem 8.',
      );
      expect(await lotLeft(lotId)).toBe(22);

      await paidOrder(token, lotId, 2);
      await createOrder(await login(OTHER_BUYER), lotId, 10).expect(201);
    });

    it('should keep the fake provider simulator closed unless it is turned on', async () => {
      process.env.FAKE_GATEWAY_SIMULATOR = 'off';

      try {
        const res = await http()
          .post('/fake-gateway/charges/00000000-0000-0000-0000-000000000000/pay')
          .expect(404);

        expect(res.body.message).toBe('Simulador do provedor fake desativado.');
      } finally {
        process.env.FAKE_GATEWAY_SIMULATOR = 'on';
      }
    });

    it('should create exactly 10 orders out of 100 simultaneous purchases for 10 tickets', async () => {
      const { lotId } = await createEvent([{ name: 'Lote', price: 4500, quantity: 10 }]);
      // Um comprador por pedido: cada um só pode ter um pedido em aberto por evento
      const buyers = await prisma.user.createManyAndReturn({
        data: Array.from({ length: 100 }, (_, i) => ({
          name: `Comprador ${i}`,
          email: `comprador-${i}@teste.com`,
          password: 'sem-login',
          document: `9${String(i).padStart(10, '0')}`,
          user_type_id: UserTypeEnum.USER,
        })),
      });
      const jwt = module.get(JwtService);

      const responses = await Promise.all(
        buyers.map(({ id, name, email }) =>
          createOrder(jwt.sign({ id, name, email }), lotId, 1),
        ),
      );
      const statuses = responses.map(({ status }) => status);

      expect(statuses.filter(status => status === 201)).toHaveLength(10);
      expect(statuses.filter(status => status === 422)).toHaveLength(90);
      expect(await prisma.order.count()).toBe(10);
      expect(await lotLeft(lotId)).toBe(0);
    }, 60_000);

    it('should keep a single open order per buyer and event', async () => {
      const { lotId } = await createEvent([{ name: 'Lote', price: 4500, quantity: 10 }]);
      const token = await login();

      const responses = await Promise.all(
        Array.from({ length: 5 }, () => createOrder(token, lotId, 1)),
      );
      const [created] = responses.filter(({ status }) => status === 201);
      const refused = responses.filter(({ status }) => status === 422);

      expect(refused).toHaveLength(4);
      expect(refused[0].body.message).toBe(OPEN_ORDER_EXISTS);
      expect(await lotLeft(lotId)).toBe(9);

      await http()
        .post(`/orders/${created.body.data.id}/cancel`)
        .auth(token, { type: 'bearer' })
        .expect(200);
      await createOrder(token, lotId, 1).expect(201);

      // Outro comprador não é afetado
      await createOrder(await login(OTHER_BUYER), lotId, 1).expect(201);
    });

    it('should not sell a lot that is not the current one', async () => {
      const startedLots = [
        { name: '1º lote', price: 4500, quantity: 2 },
        { name: '2º lote', price: 6000, quantity: 10 },
      ];
      const { eventId } = await createEvent(startedLots);
      const event = await prisma.event.findUniqueOrThrow({
        where: { id: eventId },
        include: { sectors: { include: { lots: { orderBy: { position: 'asc' } } } } },
      });
      const [, secondLot] = event.sectors[0].lots;

      const res = await createOrder(await login(), secondLot.id, 1).expect(422);

      expect(res.body.message).toBe('Este lote não está à venda.');
    });

    it('should only let the buyer see and pay an order', async () => {
      const { lotId } = await createEvent();
      const { body } = await createOrder(await login(), lotId).expect(201);
      const stranger = await login(OTHER_BUYER);

      await http()
        .get(`/orders/${body.data.id}`)
        .auth(stranger, { type: 'bearer' })
        .expect(403);
      await pay(stranger, body.data.id, CARD).expect(403);
      await http().get(`/orders/${body.data.id}`).expect(401);
    });

    it('should cancel an unpaid order and release the tickets', async () => {
      const { lotId } = await createEvent();
      const token = await login();
      const { body } = await createOrder(token, lotId).expect(201);
      const pix = await pay(token, body.data.id, PIX).expect(201);

      const res = await http()
        .post(`/orders/${body.data.id}/cancel`)
        .auth(token, { type: 'bearer' })
        .expect(200);

      expect(res.body.data.status).toBe('cancelled');
      expect(await lotLeft(lotId)).toBe(2);
      expect(await prisma.charge.findUnique({ where: { id: pix.body.data.id } })).toEqual(
        expect.objectContaining({ status: 'cancelled' }),
      );
    });

    it('should cancel a paid order, refund it and put the tickets back on sale', async () => {
      const { lotId } = await createEvent();
      const token = await login();
      const orderId = await paidOrder(token, lotId);

      const res = await http()
        .post(`/orders/${orderId}/cancel`)
        .auth(token, { type: 'bearer' })
        .expect(200);

      expect(res.body.data.status).toBe('refunded');
      expect(await countTickets(orderId, 'cancelled')).toBe(2);
      expect(await lotLeft(lotId)).toBe(2);

      const refund = await waitFor(() =>
        prisma.refund.findFirst({ where: { status: 'succeeded' } }),
      );

      expect(refund.reason).toBe('buyer_request');
      await waitFor(async () =>
        (await prisma.charge.findFirst({ where: { status: 'refunded' } })) ? true : null,
      );
    });
  });

  describe('Event cancellation', () => {
    it('should refund every paid order once, even if the job runs again', async () => {
      const { eventId, lotId } = await createEvent([
        { name: 'Lote', price: 4500, quantity: 10 },
      ]);
      const first = await paidOrder(await login(), lotId);
      const second = await paidOrder(await login(OTHER_BUYER), lotId, 1);
      const unpaid = await createOrder(await login(), lotId, 1).expect(201);

      const organizer = await login(ORGANIZER);

      await http()
        .delete(`/events/${eventId}`)
        .auth(organizer, { type: 'bearer' })
        .expect(200);

      await waitFor(
        async () => (await prisma.refund.count({ where: { status: 'succeeded' } })) === 2,
      );
      await waitForOrder(unpaid.body.data.id, 'cancelled');

      // Reexecutar o job (ex.: ele caiu no meio) não estorna de novo
      await module.get(EventCancellationConsumer).handle({
        id: '00000000-0000-0000-0000-000000000000',
        event_type: EVENT_CANCELLED,
        payload: { eventId },
        processed_at: null,
      });

      expect(await prisma.refund.count()).toBe(2);
      expect(
        (await prisma.refund.findMany()).every(
          ({ reason }) => reason === 'event_cancelled',
        ),
      ).toBe(true);
      expect(await prisma.order.findUnique({ where: { id: first } })).toEqual(
        expect.objectContaining({ status: 'refunded' }),
      );
      expect(await countTickets(second, 'cancelled')).toBe(1);
    });
  });

  describe('Chargeback', () => {
    it('should cancel the unused tickets when a dispute is opened', async () => {
      const { lotId } = await createEvent();
      const orderId = await paidOrder(await login(), lotId);
      const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

      await http()
        .post(`/fake-gateway/charges/${order.paid_charge_id}/dispute`)
        .expect(200);

      const dispute = await waitFor(() => prisma.dispute.findFirst());

      expect(dispute.status).toBe('open');
      await waitFor(async () => (await countTickets(orderId, 'cancelled')) === 2);

      await http()
        .post(`/fake-gateway/disputes/${dispute.id}/close`)
        .send({ status: 'won' })
        .expect(200);

      await waitFor(() => prisma.dispute.findFirst({ where: { status: 'won' } }));
    });
  });

  describe('Webhooks', () => {
    it('should reject an invalid signature and an unknown provider', async () => {
      const webhook = fake.signedWebhook('charge.succeeded', 'charge', 'fake_ch_1');

      await sendWebhook({
        ...webhook,
        headers: { 'x-fake-signature': 'invalida' },
      }).expect(401);
      await http().post('/webhooks/desconhecido').send({}).expect(404);
      expect(await prisma.webhookEvent.count()).toBe(0);
    });

    it('should rebuild the queue from Postgres after Redis loses its data', async () => {
      const { lotId } = await createEvent([{ name: 'Lote', price: 4500, quantity: 10 }]);
      const token = await login();
      const paid = await createOrder(token, lotId).expect(201);
      const abandoned = await createOrder(await login(OTHER_BUYER), lotId, 1).expect(201);
      const charge = await pay(token, paid.body.data.id, PIX).expect(201);

      // Webhook gravado e enfileirado, mas a fila está parada
      await module.get(QueueService).queue(QUEUES.webhooks).pause();
      await sendWebhook(
        fake.simulatePixPayment(await providerChargeId(charge.body.data.id)),
      ).expect(200);
      await prisma.order.update({
        where: { id: abandoned.body.data.id },
        data: { expires_at: new Date(Date.now() - 120_000) },
      });

      await redis.flushall();
      await module.get(MaintenanceService).runAll(new Date(Date.now() + 10 * 60_000));

      await waitForOrder(paid.body.data.id, 'paid');
      await waitForOrder(abandoned.body.data.id, 'expired');
      expect(await countTickets(paid.body.data.id)).toBe(2);
      expect(await prisma.webhookEvent.count()).toBe(1);
    });
  });

  describe('Organizer sales', () => {
    const OTHER_ORGANIZER = {
      name: 'Outra produtora',
      email: 'outra.produtora@hotmail.com',
      document: '98765432100',
      password: '12345678',
    };

    it('should show the organizer the orders, totals and lots of their own events only', async () => {
      const { eventId, lotId } = await createEvent([
        { name: 'Lote', price: 4500, quantity: 10 },
      ]);
      const paidId = await paidOrder(await login(), lotId, 2);
      await createOrder(await login(OTHER_BUYER), lotId, 1).expect(201);
      const token = await login(ORGANIZER);

      const orders = await http()
        .get(`/orders/organizer?event_id=${eventId}`)
        .auth(token, { type: 'bearer' })
        .expect(200);

      expect(orders.body.totalFiltered).toBe(2);
      expect(orders.body.content.find(({ id }) => id === paidId)).toMatchObject({
        status: 'paid',
        method: 'card',
        ticket_count: 2,
        buyer: { email: BUYER.email },
        event: { id: eventId },
        items: [{ lot_name: 'Lote', sector_name: 'Pista', quantity: 2 }],
      });

      const summary = await http()
        .get(`/orders/organizer/summary?event_id=${eventId}`)
        .auth(token, { type: 'bearer' })
        .expect(200);

      expect(summary.body).toMatchObject({
        grossRevenue: 9000,
        paidOrders: 1,
        ticketsSold: 2,
        averageOrder: 9000,
      });

      const lots = await http()
        .get(`/events/${eventId}/lots/sales`)
        .auth(token, { type: 'bearer' })
        .expect(200);

      expect(lots.body[0].lots[0]).toMatchObject({
        quantity: 10,
        sold: 2,
        reserved: 1,
        revenue: 9000,
        status: 'on_sale',
      });

      await http()
        .post('/users')
        .send({ ...OTHER_ORGANIZER, isOrganizer: true })
        .expect(201);
      const otherToken = await login({
        email: OTHER_ORGANIZER.email,
        password: OTHER_ORGANIZER.password,
      });

      await http()
        .get(`/orders/organizer?event_id=${eventId}`)
        .auth(otherToken, { type: 'bearer' })
        .expect(403);
      await http()
        .get(`/events/${eventId}/lots/sales`)
        .auth(otherToken, { type: 'bearer' })
        .expect(403);

      const otherOrders = await http()
        .get('/orders/organizer')
        .auth(otherToken, { type: 'bearer' })
        .expect(200);

      expect(otherOrders.body.content).toEqual([]);
    });

    it('should not let a buyer read sales', async () => {
      const token = await login();

      await http().get('/orders/organizer').auth(token, { type: 'bearer' }).expect(403);
    });
  });
});
