import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { generateSlug } from 'src/util/slug';
import { OffsetPagination } from 'src/response/pagination.response';
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

    const totalRecords = await this.prisma.event.count();

    const paginator = new OffsetPagination(
      totalRecords,
      events.length,
      query.skip,
      query.take,
    );

    return paginator.buildPage(
      events.splice(query.skip * query.take, query.take),
    );
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
    const tickets = [];

    for (let i = 1; i <= buyEventTicket.quantity; i++) {
      tickets.push(
        this.prisma.ticket.create({
          data: {
            event_id: buyEventTicket.eventId,
            user_id: buyEventTicket.userId,
            payment_method_id: buyEventTicket.paymentMethodId,
            price: event.price,
          },
        }),
      );
    }

    Promise.all(tickets);

    await this.prisma.event.update({
      where: {
        id: event.id,
      },
      data: {
        quantity_left: event.quantity_left - buyEventTicket.quantity,
      },
    });

    return true;
  }

  async update(id: number, userId: number, updateEventDto: UpdateEventDto) {
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
