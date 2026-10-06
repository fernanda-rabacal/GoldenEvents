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

  async findAll(query: QueryEventDto) {
    let where = {};

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

    if (query.start_date) {
      //tratamento do intervalo
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
}
