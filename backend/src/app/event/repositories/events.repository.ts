import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../db/prisma.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { generateSlug } from '../../../util/slug';
import { QueryEventDto } from '../dto/query-event.dto';
import { BuyEventTicketDto } from '../dto/buy-ticket.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEventDto: CreateEventDto) {
    const event = await this.prisma.event.create({
      data: {
        name: createEventDto.name,
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
    });
  }

  async buyTicket(buyEventTicket: BuyEventTicketDto) {
    const event = await this.findById(buyEventTicket.eventId);
    const tickets = Array.from({ length: buyEventTicket.quantity }, () => ({
      event_id: buyEventTicket.eventId,
      user_id: buyEventTicket.userId,
      payment_method_id: buyEventTicket.paymentMethodId,
      price: event.price,
    }));

    const purchasedTickets = await this.prisma.event.update({
      where: {
        id: event.id,
      },
      data: {
        quantity_left: event.quantity_left - buyEventTicket.quantity,
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

    if (updateEventDto.startDateTime) {
      data.start_date = updateEventDto.startDateTime;
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
