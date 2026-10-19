import { Injectable } from '@nestjs/common';
import { Prisma, type OrderItem, type OrderStatus } from '@prisma/client';
import type { AudienceSegment, AudienceSort } from '@golden-events/shared';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../../db/prisma.service.js';
import type { PricedItem } from '../domain/purchase-policy.js';

const ORDER_WITH_TICKETS = {
  items: {
    orderBy: { id: 'asc' },
    include: {
      tickets: {
        orderBy: { id: 'asc' },
        select: { id: true, code: true, status: true, used_at: true },
      },
    },
  },
} satisfies Prisma.OrderInclude;

export type OrganizerOrderFilters = {
  eventIds: number[];
  buyerIds?: number[];
  status?: OrderStatus;
  createdSince?: Date;
};

function organizerOrderWhere({
  eventIds,
  buyerIds,
  status,
  createdSince,
}: OrganizerOrderFilters): Prisma.OrderWhereInput {
  return {
    event_id: { in: eventIds },
    buyer_id: buyerIds ? { in: buyerIds } : undefined,
    status,
    created_at: { gte: createdSince },
  };
}

export type AudienceFilters = {
  eventIds: number[];
  buyerIds?: number[];
  segment?: AudienceSegment;
  newSince: Date;
};

type AudienceRow = {
  buyer_id: number;
  orders_count: number;
  events_count: number;
  total_cents: bigint;
  first_purchase_at: Date;
  last_purchase_at: Date;
  total: number;
};

const AUDIENCE_ORDER: Record<AudienceSort, Prisma.Sql> = {
  recent: Prisma.sql`last_purchase_at DESC`,
  spent: Prisma.sql`total_cents DESC`,
  events: Prisma.sql`events_count DESC, last_purchase_at DESC`,
};

function paidOrdersWhere({ eventIds, buyerIds }: AudienceFilters) {
  return Prisma.sql`status = 'paid' AND event_id IN (${Prisma.join(eventIds)})${
    buyerIds ? Prisma.sql` AND buyer_id IN (${Prisma.join(buyerIds)})` : Prisma.empty
  }`;
}

function audienceHaving({ segment, newSince }: AudienceFilters) {
  if (segment === 'returning') {
    return Prisma.sql`HAVING COUNT(DISTINCT event_id) > 1`;
  }

  if (segment === 'new') {
    return Prisma.sql`HAVING MIN(COALESCE(paid_at, created_at)) >= ${newSince}`;
  }

  return Prisma.empty;
}

// Código aleatório que vai no QR code do ingresso
function generateTicketCode() {
  return randomBytes(12).toString('base64url');
}

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tx: Prisma.TransactionClient,
    data: {
      buyerId: number;
      eventId: number;
      status: OrderStatus;
      subtotalCents: number;
      discountCents: number;
      totalCents: number;
      expiresAt: Date;
      paidAt: Date | null;
      items: PricedItem[];
    },
  ) {
    return tx.order.create({
      data: {
        buyer_id: data.buyerId,
        event_id: data.eventId,
        status: data.status,
        subtotal_cents: data.subtotalCents,
        discount_cents: data.discountCents,
        total_cents: data.totalCents,
        expires_at: data.expiresAt,
        paid_at: data.paidAt,
        items: {
          create: data.items.map(({ lotId, quantity, unitPriceCents }) => ({
            lot_id: lotId,
            quantity,
            unit_price_cents: unitPriceCents,
          })),
        },
      },
      include: { items: true },
    });
  }

  async findById(id: string) {
    return this.prisma.order.findUnique({ where: { id }, include: ORDER_WITH_TICKETS });
  }

  async findByBuyer(buyerId: number) {
    return this.prisma.order.findMany({
      where: { buyer_id: buyerId },
      orderBy: { created_at: 'desc' },
      include: ORDER_WITH_TICKETS,
    });
  }

  async hasOpenOrder(
    tx: Prisma.TransactionClient,
    buyerId: number,
    eventId: number,
    now: Date,
  ) {
    const count = await tx.order.count({
      where: {
        buyer_id: buyerId,
        event_id: eventId,
        status: 'awaiting_payment',
        expires_at: { gt: now },
      },
    });

    return count > 0;
  }

  async countTicketsHeld(
    tx: Prisma.TransactionClient,
    buyerId: number,
    eventId: number,
    now: Date,
  ) {
    const { _sum } = await tx.orderItem.aggregate({
      _sum: { quantity: true },
      where: {
        order: {
          buyer_id: buyerId,
          event_id: eventId,
          OR: [
            { status: 'paid' },
            { status: 'awaiting_payment', expires_at: { gt: now } },
          ],
        },
      },
    });

    return _sum.quantity ?? 0;
  }

  // SELECT ... FOR UPDATE: o job de expiração e a confirmação do pagamento nunca decidem ao mesmo tempo
  async lock(tx: Prisma.TransactionClient, id: string) {
    await tx.$queryRaw`SELECT id FROM "order" WHERE id = ${id}::uuid FOR UPDATE`;

    return tx.order.findUniqueOrThrow({ where: { id }, include: { items: true } });
  }

  async update(tx: Prisma.TransactionClient, id: string, data: Prisma.OrderUpdateInput) {
    return tx.order.update({ where: { id }, data });
  }

  async issueTickets(
    tx: Prisma.TransactionClient,
    order: { event_id: number; buyer_id: number; items: OrderItem[] },
  ) {
    await tx.ticket.createMany({
      data: order.items.flatMap(item =>
        Array.from({ length: item.quantity }, () => ({
          event_id: order.event_id,
          lot_id: item.lot_id,
          user_id: order.buyer_id,
          price: item.unit_price_cents,
          order_item_id: item.id,
          code: generateTicketCode(),
        })),
      ),
    });
  }

  async cancelValidTickets(tx: Prisma.TransactionClient, orderId: string) {
    await tx.ticket.updateMany({
      where: { order_item: { order_id: orderId }, status: 'valid' },
      data: { status: 'cancelled' },
    });
  }

  async countUsedTickets(tx: Prisma.TransactionClient, orderId: string) {
    return tx.ticket.count({
      where: { order_item: { order_id: orderId }, status: 'used' },
    });
  }

  async findOverdue(expiredBefore: Date, take: number) {
    return this.prisma.order.findMany({
      where: { status: 'awaiting_payment', expires_at: { lt: expiredBefore } },
      orderBy: { expires_at: 'asc' },
      select: { id: true },
      take,
    });
  }

  async findExpiredIdsSince(since: Date) {
    const orders = await this.prisma.order.findMany({
      where: { status: 'expired', updated_at: { gte: since } },
      select: { id: true },
    });

    return orders.map(({ id }) => id);
  }

  async findPageForEvents(filters: OrganizerOrderFilters, skip: number, take: number) {
    const where = organizerOrderWhere(filters);

    return this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        include: ORDER_WITH_TICKETS,
        skip,
        take,
      }),
    ]);
  }

  async summarizeForEvents(eventIds: number[], paidSince?: Date) {
    const paid: Prisma.OrderWhereInput = {
      event_id: { in: eventIds },
      status: 'paid',
      paid_at: { gte: paidSince },
    };

    const [orders, items, refundedOrders] = await this.prisma.$transaction([
      this.prisma.order.aggregate({
        where: paid,
        _count: true,
        _sum: { total_cents: true, platform_fee_cents: true },
      }),
      this.prisma.orderItem.aggregate({
        where: { order: paid },
        _sum: { quantity: true },
      }),
      this.prisma.order.count({ where: { ...paid, status: 'refunded' } }),
    ]);

    return {
      paidOrders: orders._count,
      totalCents: orders._sum.total_cents ?? 0,
      feeCents: orders._sum.platform_fee_cents ?? 0,
      ticketsSold: items._sum.quantity ?? 0,
      refundedOrders,
    };
  }

  // SQL cru: o groupBy do Prisma não faz COUNT(DISTINCT) nem HAVING
  async findAudiencePage(
    filters: AudienceFilters,
    sort: AudienceSort,
    skip: number,
    take: number,
  ) {
    const rows = await this.prisma.$queryRaw<AudienceRow[]>`
      SELECT buyer_id,
             COUNT(*)::int AS orders_count,
             COUNT(DISTINCT event_id)::int AS events_count,
             SUM(total_cents)::bigint AS total_cents,
             MIN(COALESCE(paid_at, created_at)) AS first_purchase_at,
             MAX(COALESCE(paid_at, created_at)) AS last_purchase_at,
             COUNT(*) OVER ()::int AS total
      FROM "order"
      WHERE ${paidOrdersWhere(filters)}
      GROUP BY buyer_id
      ${audienceHaving(filters)}
      ORDER BY ${AUDIENCE_ORDER[sort]}, buyer_id
      OFFSET ${skip} LIMIT ${take}`;

    return {
      total: rows[0]?.total ?? 0,
      members: rows.map(row => ({
        buyer_id: row.buyer_id,
        orders_count: row.orders_count,
        events_count: row.events_count,
        total_cents: Number(row.total_cents),
        first_purchase_at: row.first_purchase_at,
        last_purchase_at: row.last_purchase_at,
      })),
    };
  }

  async summarizeAudience(filters: AudienceFilters) {
    const [row] = await this.prisma.$queryRaw<
      {
        buyers: number;
        returning_buyers: number;
        new_buyers: number;
        total_cents: bigint;
      }[]
    >`
      SELECT COUNT(*)::int AS buyers,
             COUNT(*) FILTER (WHERE events_count > 1)::int AS returning_buyers,
             COUNT(*) FILTER (WHERE first_purchase_at >= ${filters.newSince})::int AS new_buyers,
             COALESCE(SUM(total_cents), 0)::bigint AS total_cents
      FROM (
        SELECT COUNT(DISTINCT event_id) AS events_count,
               MIN(COALESCE(paid_at, created_at)) AS first_purchase_at,
               SUM(total_cents) AS total_cents
        FROM "order"
        WHERE ${paidOrdersWhere(filters)}
        GROUP BY buyer_id
      ) AS audience`;

    return {
      buyers: row.buyers,
      returningBuyers: row.returning_buyers,
      newBuyers: row.new_buyers,
      totalCents: Number(row.total_cents),
    };
  }

  async countTicketsByBuyer(eventIds: number[], buyerIds: number[]) {
    const groups = await this.prisma.ticket.groupBy({
      by: ['user_id', 'status'],
      where: {
        event_id: { in: eventIds },
        user_id: { in: buyerIds },
        status: { in: ['valid', 'used'] },
      },
      _count: { _all: true },
    });

    const counts = new Map<number, { tickets: number; used: number }>();

    for (const { user_id, status, _count } of groups) {
      const current = counts.get(user_id) ?? { tickets: 0, used: 0 };

      current.tickets += _count._all;

      if (status === 'used') {
        current.used += _count._all;
      }

      counts.set(user_id, current);
    }

    return counts;
  }

  async findOpenByEvent(eventId: number, take: number, cursor?: string) {
    return this.prisma.order.findMany({
      where: {
        event_id: eventId,
        status: { in: ['awaiting_payment', 'paid'] },
        id: cursor ? { gt: cursor } : undefined,
      },
      orderBy: { id: 'asc' },
      select: { id: true, status: true },
      take,
    });
  }
}
