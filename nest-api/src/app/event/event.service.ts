import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { PrismaService } from 'src/db/prisma.service';
import { OffsetPagination } from 'src/response/pagination.response';
import { generateSlug } from 'src/util/slug';

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

  async update(id: number, updateEventDto: UpdateEventDto) {
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
