import { Injectable } from '@nestjs/common';
import { canManageEvents } from '@golden-events/shared';
import type {
  CreateEventInput,
  EventListQuery,
  UpdateEventInput,
} from './event-inputs.js';
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

  async create(requester: Requester, input: CreateEventInput) {
    if (!canManageEvents(requester.user_type_id)) {
      throw new ForbiddenError('Apenas organizadores podem criar eventos.');
    }

    const category = await this.categoryRepository.findById(input.categoryId);

    if (!category) {
      throw new NotFoundError('Categoria não encontrada.');
    }

    validateSalesWindows(input.sectors, new Date(input.startDateTime));

    return this.repository.create(requester.id, input);
  }

  async findAll(query: EventListQuery, userId?: number) {
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

  async update(requester: Requester, id: number, input: UpdateEventInput) {
    const event = await this.findById(id);

    if (event.user_id !== requester.id) {
      throw new ForbiddenError('Você não pode editar um evento que não é seu.');
    }

    if (input.sectors) {
      validateSectorChanges(event.sectors, input.sectors);
    }

    if (input.sectors || input.startDateTime) {
      validateSalesWindows(
        input.sectors ??
          event.sectors.map(({ lots }) => ({
            lots: lots.map(({ name, sales_start, sales_end }) => ({
              name,
              salesStart: sales_start,
              salesEnd: sales_end,
            })),
          })),
        new Date(input.startDateTime ?? event.start_date),
      );
    }

    validateEventDates(input.startDateTime, input.endDateTime);

    return this.repository.update(id, input);
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
