import {
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { PrismaService } from '../../db/prisma.service';
import { OffsetPagination } from '../../response/pagination.response';
import { generateSlug } from '../../util/slug';
import { BuyEventTicket } from './dto/buy-ticket.dto';

@Injectable()
export class EventService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createEventDto: CreateEventDto) {
    const category = this.prismaService.eventCategory.findFirst({
      where: {
        id: createEventDto.categoryId,
      },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    const event = await this.prismaService.event.create({
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
    try {
      const events = await this.prismaService.event.findMany({
        where: query.mountWhere(),
      });

      const totalRecords = await this.prismaService.event.count();

      const paginator = new OffsetPagination(
        totalRecords,
        events.length,
        query.skip,
        query.take,
      );

      return paginator.buildPage(
        events.splice(query.skip * query.take, query.take),
      );
    } catch (e) {
      throw new InternalServerErrorException({
        message: 'Não foi possivel realizar sua solicitação',
      });
    }
  }

  async findById(eventId: number) {
    const event = await this.prismaService.event.findFirst({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException({ message: 'Evento não encontrado' });
    }

    return event;
  }

  async findBySlug(slug: string) {
    const event = await this.prismaService.event.findFirst({
      where: {
        slug,
      },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    return event;
  }

  async buyTicket(buyEventTicket: BuyEventTicket) {
    try {
      const event = await this.findById(buyEventTicket.eventId);
      const tickets = [];

      for (let i = 1; i <= buyEventTicket.quantity; i++) {
        tickets.push(
          this.prismaService.ticket.create({
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

      await this.prismaService.event.update({
        where: {
          id: event.id,
        },
        data: {
          quantity_left: event.quantity_left - buyEventTicket.quantity,
        },
      });

      return true;
    } catch (e) {
      throw new InternalServerErrorException({
        message: 'Houve um erro e a solicitação não pôde ser concluida.',
      });
    }
  }

  async update(id: number, userId: number, updateEventDto: UpdateEventDto) {
    const { user_id } = await this.findById(id);

    if (userId !== user_id) {
      throw new NotAcceptableException(
        'Você não pode editar um evento que não é seu.',
      );
    }

    const event = await this.prismaService.event.update({
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
    try {
      await this.prismaService.event.update({
        data: {
          active: false,
        },
        where: {
          id: id,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException({
        message: 'Houve um erro e a solicitação não pôde ser concluida.',
      });
    }
  }
}
