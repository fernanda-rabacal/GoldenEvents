import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../db/prisma.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { generateSlug } from '../../../util/slug';
import { QueryEventDto } from '../dto/query-event.dto';
import { BuyEventTicketDto } from '../dto/buy-ticket.dto';
import { UpdateEventDto } from '../dto/update-event.dto';

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
    const events = await this.prisma.event.findMany({
      where: query.mountWhere(),
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
    const event = await this.prisma.event.update({
      where: {
        id: Number(id),
      },
      data: {
        name: updateEventDto.name,
        start_date: updateEventDto.startDateTime,
        description: updateEventDto.description,
        category_id: updateEventDto.categoryId,
        capacity: updateEventDto.capacity,
        price: updateEventDto.price,
        location: updateEventDto.location,
      },
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
