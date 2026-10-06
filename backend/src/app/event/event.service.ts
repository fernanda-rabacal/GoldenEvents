import { Injectable, NotAcceptableException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { QueryEventDto } from './dto/query-event.dto.js';
import { BuyEventTicketDto } from './dto/buy-ticket.dto.js';
import { CategoryRepository } from './repositories/categories.repository.js';
import { EventRepository } from './repositories/events.repository.js';
import { NotFoundError } from '../common/errors/types/NotFoundError.js';
import { OffsetPagination } from '../../response/pagination.response.js';

@Injectable()
export class EventService {
  constructor(
    private readonly repository: EventRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async create(createEventDto: CreateEventDto) {
    const category = this.categoryRepository.findById(createEventDto.categoryId);

    if (!category) {
      throw new NotFoundError('Categoria não encontrada.');
    }

    return this.repository.create(createEventDto);
  }

  async findAll(query: QueryEventDto) {
    const events = await this.repository.findAll(query);

    const totalRecords = events.length;

    const paginator = new OffsetPagination(
      totalRecords,
      totalRecords,
      query.skip,
      query.take,
    );

    return paginator.paginate(events);
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
    await this.findById(buyEventTicket.eventId);

    return this.repository.buyTicket(buyEventTicket);
  }

  async update(id: number, userId: number, updateEventDto: UpdateEventDto) {
    const { user_id, capacity, quantity_left } = await this.findById(id);

    const ticketsPurchased = capacity - quantity_left;

    if (userId !== user_id) {
      throw new NotAcceptableException('Você não pode editar um evento que não é seu.');
    }

    if (ticketsPurchased > updateEventDto.capacity) {
      throw new NotAcceptableException(
        'A capacidade do evento não pode ser menor do que a quantidade de ingressos já comprados.',
      );
    }

    if (
      updateEventDto.startDateTime &&
      updateEventDto.endDateTime &&
      +updateEventDto.startDateTime > +updateEventDto.endDateTime
    ) {
      throw new NotAcceptableException(
        'A data final do evento não pode ser antes da data de início.',
      );
    }

    return this.repository.update(id, updateEventDto);
  }

  async delete(id: number, userId: number) {
    const { user_id } = await this.findById(id);

    if (userId !== user_id) {
      throw new NotAcceptableException('Você não pode deletar um evento que não é seu.');
    }

    return this.repository.delete(id);
  }
}
