import { Injectable } from '@nestjs/common';
import { canManageEvents } from '@golden-events/shared';
import { CreateEventDto } from '../infra/http/dto/create-event.dto.js';
import { UpdateEventDto } from '../infra/http/dto/update-event.dto.js';
import { QueryEventDto } from '../infra/http/dto/query-event.dto.js';
import {
  validateEventDates,
  validateSalesWindows,
  validateSectorChanges,
} from '../domain/event-policy.js';
import { EVENT_CANCELLED } from '../domain/events.js';
import { CategoryRepository } from '../infra/category.repository.js';
import { EventRepository } from '../infra/event.repository.js';
import { ForbiddenError } from '../../common/errors/types/ForbiddenError.js';
import { NotFoundError } from '../../common/errors/types/NotFoundError.js';
import type { Requester } from '../../common/auth/requester.js';
import { OffsetPagination } from '../../../response/pagination.response.js';
import { OutboxService } from '../../../shared/outbox/outbox.service.js';
import { PrismaService } from '../../../db/prisma.service.js';

@Injectable()
export class EventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: EventRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly outbox: OutboxService,
  ) {}

  async create(requester: Requester, createEventDto: CreateEventDto) {
    if (!canManageEvents(requester.user_type_id)) {
      throw new ForbiddenError('Apenas organizadores podem criar eventos.');
    }

    const category = await this.categoryRepository.findById(createEventDto.categoryId);

    if (!category) {
      throw new NotFoundError('Categoria não encontrada.');
    }

    validateSalesWindows(createEventDto.sectors, new Date(createEventDto.startDateTime));

    return this.repository.create(requester.id, createEventDto);
  }

  async findAll(query: QueryEventDto, userId?: number) {
    const pagination = OffsetPagination.fromQuery(query);
    const { skip, take } = pagination.filterProps();
    const [total, events] = await this.repository.findPage(query, userId, skip, take);

    return pagination.page(total, events);
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

  async update(requester: Requester, id: number, updateEventDto: UpdateEventDto) {
    const event = await this.findById(id);

    if (event.user_id !== requester.id) {
      throw new ForbiddenError('Você não pode editar um evento que não é seu.');
    }

    if (updateEventDto.sectors) {
      validateSectorChanges(event.sectors, updateEventDto.sectors);
    }

    if (updateEventDto.sectors || updateEventDto.startDateTime) {
      validateSalesWindows(
        updateEventDto.sectors ??
          event.sectors.map(({ lots }) => ({
            lots: lots.map(({ name, sales_start, sales_end }) => ({
              name,
              salesStart: sales_start,
              salesEnd: sales_end,
            })),
          })),
        new Date(updateEventDto.startDateTime ?? event.start_date),
      );
    }

    validateEventDates(updateEventDto.startDateTime, updateEventDto.endDateTime);

    return this.repository.update(id, updateEventDto);
  }

  async delete(requester: Requester, id: number) {
    const { user_id, active, start_date } = await this.findById(id);

    if (user_id !== requester.id) {
      throw new ForbiddenError('Você não pode deletar um evento que não é seu.');
    }

    // Só um evento que ainda não aconteceu é cancelado (com estorno dos pedidos);
    // apagar um evento passado apenas o esconde
    const cancelSales = active && start_date > new Date();

    return this.prisma.$transaction(async tx => {
      const event = await this.repository.deactivate(tx, id);

      if (cancelSales) {
        await this.outbox.add(tx, EVENT_CANCELLED, { eventId: id });
      }

      return event;
    });
  }
}
