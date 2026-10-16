import { Injectable } from '@nestjs/common';
import { Prisma, type OrderItem, type OrderStatus } from '@prisma/client';
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
