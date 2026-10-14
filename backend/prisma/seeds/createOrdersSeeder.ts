import {
  PrismaClient,
  type ChargeMethod,
  type ChargeStatus,
  type OrderStatus,
  type RefundReason,
  type TicketStatus,
} from '@prisma/client';
import { summarizeLots } from '@golden-events/shared';
import { randomBytes, randomUUID } from 'crypto';

type SeedOrder = {
  buyerEmail: string;
  eventSlug: string;
  sectorName?: string;
  quantity: number;
  status: OrderStatus;
  daysAgo: number;
  charge?: { method: ChargeMethod; status: ChargeStatus };
  // Um status por ingresso; sem ingressos quando o pedido nunca foi pago
  tickets?: TicketStatus[];
  refundReason?: RefundReason;
  dispute?: boolean;
  // O pedido segura o estoque: pago, aguardando pagamento ou em disputa
  holdsStock: boolean;
};

const GABRIEL = 'mayan@hotmail.com';
const DAVI = 'davi@hotmail.com';

// Um pedido de cada situação, para as telas e a API terem o que mostrar.
// As cobranças são do provedor fake, que é em memória: não dá para pagar ou disputar
// essas cobranças pelo simulador, mas o estorno funciona
const ORDERS: SeedOrder[] = [
  {
    buyerEmail: GABRIEL,
    eventSlug: 'design-e-coffee',
    quantity: 2,
    status: 'paid',
    daysAgo: 2,
    charge: { method: 'card', status: 'succeeded' },
    tickets: ['valid', 'valid'],
    holdsStock: true,
  },
  {
    buyerEmail: DAVI,
    eventSlug: 'corrida-golden-5k',
    quantity: 1,
    status: 'paid',
    daysAgo: 1,
    charge: { method: 'pix', status: 'succeeded' },
    tickets: ['valid'],
    holdsStock: true,
  },
  {
    buyerEmail: GABRIEL,
    eventSlug: 'sunset-paradise',
    sectorName: 'Pista',
    quantity: 2,
    status: 'paid',
    daysAgo: 960,
    charge: { method: 'card', status: 'succeeded' },
    tickets: ['used', 'valid'],
    holdsStock: true,
  },
  {
    buyerEmail: DAVI,
    eventSlug: 'festival-sabores-da-bahia',
    quantity: 2,
    status: 'paid',
    daysAgo: 3,
    tickets: ['valid', 'valid'],
    holdsStock: true,
  },
  {
    buyerEmail: GABRIEL,
    eventSlug: 'noite-de-stand-up',
    sectorName: 'Plateia',
    quantity: 1,
    status: 'refunded',
    daysAgo: 4,
    charge: { method: 'card', status: 'refunded' },
    tickets: ['cancelled'],
    refundReason: 'buyer_request',
    holdsStock: false,
  },
  {
    buyerEmail: DAVI,
    eventSlug: 'design-e-coffee',
    quantity: 1,
    status: 'paid',
    daysAgo: 5,
    charge: { method: 'card', status: 'succeeded' },
    tickets: ['cancelled'],
    dispute: true,
    holdsStock: true,
  },
  {
    buyerEmail: DAVI,
    eventSlug: 'festival-de-verao',
    sectorName: 'Pista',
    quantity: 2,
    status: 'expired',
    daysAgo: 1,
    charge: { method: 'pix', status: 'cancelled' },
    holdsStock: false,
  },
  {
    buyerEmail: GABRIEL,
    eventSlug: 'festival-de-verao',
    sectorName: 'Camarote',
    quantity: 1,
    status: 'cancelled',
    daysAgo: 1,
    holdsStock: false,
  },
  {
    buyerEmail: GABRIEL,
    eventSlug: 'corrida-golden-5k',
    quantity: 3,
    status: 'awaiting_payment',
    daysAgo: 0,
    holdsStock: true,
  },
];

const PAID_STATUSES: OrderStatus[] = ['paid', 'refunded'];

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000);
}

export async function createOrders(prisma: PrismaClient) {
  const touchedEvents = new Set<number>();

  for (const seed of ORDERS) {
    const buyer = await prisma.user.findUniqueOrThrow({
      where: { email: seed.buyerEmail },
    });
    const lot = await prisma.lot.findFirstOrThrow({
      where: {
        sector: { name: seed.sectorName ?? 'Geral', event: { slug: seed.eventSlug } },
      },
      orderBy: { position: 'asc' },
      include: { sector: { include: { event: true } } },
    });
    const { event } = lot.sector;
    const totalCents = lot.price * seed.quantity;
    const createdAt = daysAgo(seed.daysAgo);
    const isPaid = PAID_STATUSES.includes(seed.status);

    const order = await prisma.order.create({
      data: {
        buyer_id: buyer.id,
        event_id: event.id,
        status: seed.status,
        subtotal_cents: totalCents,
        total_cents: totalCents,
        expires_at: new Date(
          (seed.status === 'awaiting_payment' ? Date.now() : createdAt.getTime()) +
            10 * 60_000,
        ),
        paid_at: isPaid ? createdAt : null,
        created_at: createdAt,
        items: {
          create: [
            { lot_id: lot.id, quantity: seed.quantity, unit_price_cents: lot.price },
          ],
        },
      },
      include: { items: true },
    });

    const charge =
      seed.charge &&
      (await prisma.charge.create({
        data: {
          origin_type: 'order',
          origin_id: order.id,
          customer_id: buyer.id,
          amount_cents: totalCents,
          currency: 'BRL',
          method: seed.charge.method,
          status: seed.charge.status,
          provider: 'fake',
          provider_charge_id: `seed_ch_${randomUUID()}`,
          idempotency_key: `charge:order:${order.id}:1`,
          pix_qr_code:
            seed.charge.method === 'pix'
              ? `00020126580014br.gov.bcb.pix-seed-${order.id}`
              : null,
          created_at: createdAt,
        },
      }));

    if (charge && isPaid) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paid_charge_id: charge.id },
      });
    }

    if (seed.tickets) {
      await prisma.ticket.createMany({
        data: seed.tickets.map(status => ({
          event_id: event.id,
          lot_id: lot.id,
          user_id: buyer.id,
          price: lot.price,
          order_item_id: order.items[0].id,
          code: randomBytes(12).toString('base64url'),
          status,
          used_at: status === 'used' ? event.start_date : null,
          created_at: createdAt,
        })),
      });
    }

    if (seed.refundReason) {
      await prisma.refund.create({
        data: {
          charge_id: charge.id,
          amount_cents: totalCents,
          reason: seed.refundReason,
          status: 'succeeded',
          provider_refund_id: `seed_re_${randomUUID()}`,
          idempotency_key: `refund:${seed.refundReason}:${order.id}`,
        },
      });
    }

    if (seed.dispute) {
      await prisma.dispute.create({
        data: {
          charge_id: charge.id,
          provider_dispute_id: `seed_dp_${randomUUID()}`,
          status: 'open',
          amount_cents: totalCents,
          reason: 'fraudulent',
        },
      });
    }

    if (seed.holdsStock) {
      await prisma.lot.update({
        where: { id: lot.id },
        data: { quantity_left: { decrement: seed.quantity } },
      });
    }

    touchedEvents.add(event.id);
  }

  for (const eventId of touchedEvents) {
    const lots = await prisma.lot.findMany({ where: { sector: { event_id: eventId } } });

    await prisma.event.update({ where: { id: eventId }, data: summarizeLots(lots) });
  }
}
