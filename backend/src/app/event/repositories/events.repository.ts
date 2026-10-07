import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../db/prisma.service.js';
import { CreateEventDto } from '../dto/create-event.dto.js';
import { generateSlug } from '../../../util/slug.js';
import { QueryEventDto } from '../dto/query-event.dto.js';
import { BuyEventTicketDto } from '../dto/buy-ticket.dto.js';
import { UpdateEventDto } from '../dto/update-event.dto.js';
import { Prisma } from '@prisma/client';
import type { EventSort } from '@golden-events/shared';

const EVENT_ORDER_BY: Record<EventSort, Prisma.EventOrderByWithRelationInput[]> = {
  start_date: [{ start_date: 'asc' }, { id: 'asc' }],
  created_at: [{ created_at: 'desc' }, { id: 'desc' }],
  price: [{ price: 'asc' }, { start_date: 'asc' }, { id: 'asc' }],
};

@Injectable()
export class EventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEventDto: CreateEventDto) {
    const event = await this.prisma.event.create({
      data: {
        name: createEventDto.name,
        subtitle: createEventDto.subtitle || null,
        start_date: createEventDto.startDateTime,
        end_date: createEventDto.endDateTime,
        description: createEventDto.description,
        category_id: createEventDto.categoryId,
        user_id: createEventDto.userId,
        capacity: createEventDto.capacity,
        price: createEventDto.price,
        location: createEventDto.location,
        quantity_left: createEventDto.capacity,
        slug: generateSlug(createEventDto.name),
      },
    });

    return event;
  }

  async findAll(query: QueryEventDto, userId?: number) {
    let where = {};

    if (userId) {
      where = { ...where, user_id: userId };
    }

    if (query.name) {
      where = {
        ...where,
        name: {
          contains: query.name,
          mode: 'insensitive',
        },
      };
    }

    if (query.active) {
      where = {
        ...where,
        active: Boolean(Number(query.active)),
      };
    }

    if (query.category_id) {
      where = {
        ...where,
        category_id: Number(query.category_id),
      };
    }

    // A listagem pública só mostra eventos ativos que ainda não começaram; o organizador vê todos os seus
    if (!userId) {
      const now = new Date();
      const requestedStart = query.start_date ? new Date(query.start_date) : now;

      where = {
        ...where,
        active: true,
        start_date: { gte: requestedStart > now ? requestedStart : now },
      };
    } else if (query.start_date) {
      where = {
        ...where,
        start_date: {
          gte: new Date(query.start_date),
        },
      };
    }

    const events = await this.prisma.event.findMany({
      where,
      orderBy: EVENT_ORDER_BY[query.sort ?? 'start_date'],
      include: {
        category: true,
      },
    });

    return events;
  }

  async findById(id: number) {
    return this.prisma.event.findFirst({
      where: {
        id,
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.event.findFirst({
      where: {
        slug,
      },
      include: {
        category: true,
        user: { select: { id: true, name: true } },
      },
    });
  }

  async buyTicket(buyEventTicket: BuyEventTicketDto) {
    const event = await this.findById(buyEventTicket.eventId);
    // Criados pela relação event.tickets: o Prisma preenche o event_id
    const tickets = Array.from({ length: buyEventTicket.quantity }, () => ({
      user_id: buyEventTicket.userId,
      payment_method_id: buyEventTicket.paymentMethodId,
      price: event.price,
    }));

    const purchasedTickets = await this.prisma.event.update({
      where: {
        id: event.id,
      },
      data: {
        quantity_left: { decrement: buyEventTicket.quantity },
        tickets: {
          createMany: {
            data: tickets,
          },
        },
      },
      include: {
        tickets: true,
      },
    });

    return purchasedTickets;
  }

  async update(id: number, updateEventDto: UpdateEventDto) {
    const data: Prisma.EventUpdateInput = {};

    if (updateEventDto.name) {
      data.name = updateEventDto.name;
    }

    // null (ou texto vazio) remove o subtítulo; ausente mantém o atual
    if (updateEventDto.subtitle !== undefined) {
      data.subtitle = updateEventDto.subtitle || null;
    }

    if (updateEventDto.description) {
      data.description = updateEventDto.description;
    }

    if (updateEventDto.startDateTime) {
      data.start_date = updateEventDto.startDateTime;
    }

    if (updateEventDto.endDateTime) {
      data.end_date = updateEventDto.endDateTime;
    }

    if (updateEventDto.categoryId) {
      data.category = {
        connect: {
          id: updateEventDto.categoryId,
        },
      };
    }

    if (updateEventDto.capacity) {
      data.capacity = updateEventDto.capacity;
    }

    if (updateEventDto.price) {
      data.price = updateEventDto.price;
    }

    if (updateEventDto.location) {
      data.location = updateEventDto.location;
    }

    const event = await this.prisma.event.update({
      where: {
        id,
      },
      data,
    });

    return event;
  }

  async delete(id: number) {
    return this.prisma.event.update({
      data: {
        active: false,
      },
      where: {
        id: id,
      },
    });
  }

  async getTicketStats(userId: number, from?: Date, to?: Date) {
    const where: Prisma.TicketWhereInput = {
      event: { user_id: userId },
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

  async countActiveEvents(userId: number, now: Date, createdSince?: Date) {
    return this.prisma.event.count({
      where: {
        user_id: userId,
        active: true,
        created_at: { gte: createdSince },
        OR: [{ end_date: { gte: now } }, { end_date: null, start_date: { gte: now } }],
      },
    });
  }

  async findTicketDatesSince(userId: number, since: Date) {
    return this.prisma.ticket.findMany({
      where: { event: { user_id: userId }, created_at: { gte: since } },
      select: { created_at: true },
    });
  }
}
