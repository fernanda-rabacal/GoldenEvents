import { Injectable, NotAcceptableException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { BuyEventTicketDto } from './dto/buy-ticket.dto';
import { CategoryRepository } from './repositories/categories.repository';
import { EventRepository } from './repositories/events.repository';
import { NotFoundError } from '../common/errors/types/NotFoundError';

@Injectable()
export class EventService {
  constructor(
    private readonly repository: EventRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async create(createEventDto: CreateEventDto) {
    const category = this.categoryRepository.findById(
      createEventDto.categoryId,
    );

    if (!category) {
      throw new NotFoundError('Categoria não encontrada.');
    }

    return this.repository.create(createEventDto);
  }

  async findAll(query: QueryEventDto) {
    return this.repository.findAll(query);
  }

  async findById(eventId: number) {
    const event = await this.repository.findById(eventId);

    if (!event) {
      throw new NotFoundError('Evento não encontrado');
    }

    return event;
  }

  async findBySlug(slug: string) {
    const event = await this.repository.findBySlug(slug);

    if (!event) {
      throw new NotFoundError('Evento não encontrado');
    }

    return event;
  }

  async buyTicket(buyEventTicket: BuyEventTicketDto) {
    return this.repository.buyTicket(buyEventTicket);
  }

  async update(id: number, userId: number, updateEventDto: UpdateEventDto) {
    const { user_id } = await this.findById(id);

    if (userId !== user_id) {
      throw new NotAcceptableException(
        'Você não pode editar um evento que não é seu.',
      );
    }

    return this.repository.update(id, userId, updateEventDto);
  }

  async delete(id: number) {
    return this.repository.delete(id);
  }
}
