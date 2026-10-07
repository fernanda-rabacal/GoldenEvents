import { ForbiddenException, Injectable, NotAcceptableException } from '@nestjs/common';
import {
  canManageEvents,
  type MetricsPeriod,
  type OrganizerMetrics,
} from '@golden-events/shared';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { QueryEventDto } from './dto/query-event.dto.js';
import { BuyEventTicketDto } from './dto/buy-ticket.dto.js';
import { CategoryRepository } from './repositories/categories.repository.js';
import { EventRepository } from './repositories/events.repository.js';
import { NotFoundError } from '../common/errors/types/NotFoundError.js';
import { OffsetPagination } from '../../response/pagination.response.js';
import type { Requester } from '../user/user.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const COMPARISON_DAYS = 30;

// Os dias do gráfico seguem o horário de Brasília, não o UTC do servidor (o Brasil não tem mais horário de verão)
const METRICS_TIME_ZONE = 'America/Sao_Paulo';
const METRICS_UTC_OFFSET = '-03:00';

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: METRICS_TIME_ZONE,
});

// "2026-10-06"
function toDateKey(date: Date) {
  return dateKeyFormatter.format(date);
}

function startOfDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00${METRICS_UTC_OFFSET}`);
}

function percentChange(current: number, previous: number) {
  if (previous === 0) {
    return null;
  }

  return Math.round(((current - previous) / previous) * 1000) / 10;
}

@Injectable()
export class EventService {
  constructor(
    private readonly repository: EventRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async create(requester: Requester, createEventDto: CreateEventDto) {
    if (!canManageEvents(requester.user_type_id)) {
      throw new ForbiddenException('Apenas organizadores podem criar eventos.');
    }

    const category = await this.categoryRepository.findById(createEventDto.categoryId);

    if (!category) {
      throw new NotFoundError('Categoria não encontrada.');
    }

    return this.repository.create(createEventDto);
  }

  async findAll(query: QueryEventDto, userId?: number) {
    const events = await this.repository.findAll(query, userId);

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
    const { active, start_date, quantity_left } = await this.findById(
      buyEventTicket.eventId,
    );

    if (!active) {
      throw new NotAcceptableException('As vendas deste evento estão encerradas.');
    }

    if (start_date <= new Date()) {
      throw new NotAcceptableException(
        'Não é possível comprar ingressos para um evento que já começou.',
      );
    }

    if (buyEventTicket.quantity > quantity_left) {
      throw new NotAcceptableException(
        'Não há ingressos suficientes disponíveis para esta compra.',
      );
    }

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

  async getOrganizerMetrics(
    requester: Requester,
    days: MetricsPeriod,
  ): Promise<OrganizerMetrics> {
    if (!canManageEvents(requester.user_type_id)) {
      throw new ForbiddenException('Apenas organizadores têm acesso às métricas.');
    }

    const userId = requester.id;
    const now = new Date();
    const comparisonStart = new Date(now.getTime() - COMPARISON_DAYS * DAY_MS);
    const previousStart = new Date(now.getTime() - 2 * COMPARISON_DAYS * DAY_MS);
    const monthStart = startOfDateKey(`${toDateKey(now).slice(0, 7)}-01`);

    const dateKeys = Array.from({ length: days }, (_, index) =>
      toDateKey(new Date(now.getTime() - (days - 1 - index) * DAY_MS)),
    );

    const [total, current, previous, activeEvents, createdThisMonth, recentTickets] =
      await Promise.all([
        this.repository.getTicketStats(userId),
        this.repository.getTicketStats(userId, comparisonStart),
        this.repository.getTicketStats(userId, previousStart, comparisonStart),
        this.repository.countActiveEvents(userId, now),
        this.repository.countActiveEvents(userId, now, monthStart),
        this.repository.findTicketDatesSince(userId, startOfDateKey(dateKeys[0])),
      ]);

    const ticketsByDay = new Map(dateKeys.map(dateKey => [dateKey, 0]));

    for (const { created_at } of recentTickets) {
      const dateKey = toDateKey(created_at);

      if (ticketsByDay.has(dateKey)) {
        ticketsByDay.set(dateKey, ticketsByDay.get(dateKey) + 1);
      }
    }

    return {
      ticketsSold: {
        total: total.tickets,
        change: percentChange(current.tickets, previous.tickets),
      },
      revenue: {
        total: total.revenue,
        change: percentChange(current.revenue, previous.revenue),
      },
      audience: {
        total: total.audience,
        change: percentChange(current.audience, previous.audience),
      },
      activeEvents: { total: activeEvents, createdThisMonth },
      dailySales: dateKeys.map(date => ({ date, tickets: ticketsByDay.get(date) })),
    };
  }
}
