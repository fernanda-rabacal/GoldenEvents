import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { TicketStats } from '../domain/organizer-metrics.js';
import { PrismaService } from '../../../db/prisma.service.js';

const NOT_CANCELLED = { not: 'cancelled' } as const;

@Injectable()
export class TicketsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByBuyer(buyerId: number) {
    return this.prisma.ticket.findMany({
      where: { user_id: buyerId },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        event_id: true,
        lot_id: true,
        code: true,
        status: true,
        used_at: true,
        created_at: true,
      },
    });
  }

  async summarizeForEvents(
    eventIds: number[],
    from?: Date,
    to?: Date,
  ): Promise<TicketStats> {
    const where: Prisma.TicketWhereInput = {
      event_id: { in: eventIds },
      status: NOT_CANCELLED,
      created_at: { gte: from, lt: to },
    };

    const [totals, buyers] = await Promise.all([
      this.prisma.ticket.aggregate({ where, _count: true, _sum: { price: true } }),
      this.prisma.ticket.findMany({
        where,
        distinct: ['user_id'],
        select: { user_id: true },
      }),
    ]);

    return {
      tickets: totals._count,
      revenue: totals._sum.price ?? 0,
      audience: buyers.length,
    };
  }

  async findDatesForEvents(eventIds: number[], since: Date) {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        event_id: { in: eventIds },
        status: NOT_CANCELLED,
        created_at: { gte: since },
      },
      select: { created_at: true },
    });

    return tickets.map(({ created_at }) => created_at);
  }

  async summarizeByLot(eventId: number) {
    const groups = await this.prisma.ticket.groupBy({
      by: ['lot_id'],
      where: { event_id: eventId, status: NOT_CANCELLED },
      _count: { _all: true },
      _sum: { price: true },
    });

    return groups.map(({ lot_id, _count, _sum }) => ({
      lotId: lot_id,
      sold: _count._all,
      revenue: _sum.price ?? 0,
    }));
  }
}
