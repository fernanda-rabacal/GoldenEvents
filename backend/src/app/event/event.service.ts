import { Injectable } from '@nestjs/common';
import type { Lot, Sector } from '@prisma/client';
import {
  canManageEvents,
  type MetricsPeriod,
  type OrganizerMetrics,
} from '@golden-events/shared';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { CreateLotDto } from './dto/lot.dto.js';
import { UpdateSectorDto } from './dto/sector.dto.js';
import { QueryEventDto } from './dto/query-event.dto.js';
import { CategoryRepository } from './repositories/categories.repository.js';
import { EventRepository } from './repositories/events.repository.js';
import { buildSectorSales } from './lot-sales.js';
import { BusinessRuleError } from '../common/errors/types/BusinessRuleError.js';
import { ForbiddenError } from '../common/errors/types/ForbiddenError.js';
import { NotFoundError } from '../common/errors/types/NotFoundError.js';
import { OffsetPagination } from '../../response/pagination.response.js';
import type { Requester } from '../common/auth/requester.js';

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

type SalesWindow = Pick<CreateLotDto, 'name' | 'salesStart' | 'salesEnd'>;

function validateSalesWindows(sectors: { lots: SalesWindow[] }[], eventStart: Date) {
  for (const { name, salesStart, salesEnd } of sectors.flatMap(({ lots }) => lots)) {
    if (salesStart && salesEnd && salesEnd <= salesStart) {
      throw new BusinessRuleError(
        `O fim das vendas do lote "${name}" precisa ser depois do início.`,
      );
    }

    if (salesEnd && salesEnd > eventStart) {
      throw new BusinessRuleError(
        `As vendas do lote "${name}" não podem terminar depois do início do evento.`,
      );
    }
  }
}

function validateSectorChanges(
  saved: (Sector & { lots: Lot[] })[],
  sectors: UpdateSectorDto[],
) {
  const savedSectorIds = new Set(saved.map(({ id }) => id));
  const savedLots = new Map(saved.flatMap(({ lots }) => lots).map(lot => [lot.id, lot]));
  const keptLotIds = new Set<number>();

  for (const sector of sectors) {
    if (sector.id && !savedSectorIds.has(sector.id)) {
      throw new NotFoundError('Setor não encontrado.');
    }

    for (const lot of sector.lots.filter(({ id }) => id)) {
      const savedLot = savedLots.get(lot.id);

      if (!savedLot) {
        throw new NotFoundError('Lote não encontrado.');
      }

      const sold = savedLot.quantity - savedLot.quantity_left;

      if (lot.quantity < sold) {
        throw new BusinessRuleError(
          `O lote "${savedLot.name}" já vendeu ${sold} ingressos e não pode ter uma quantidade menor que isso.`,
        );
      }

      keptLotIds.add(lot.id);
    }
  }

  const removedSoldLot = [...savedLots.values()].find(
    lot => !keptLotIds.has(lot.id) && lot.quantity_left < lot.quantity,
  );

  if (removedSoldLot) {
    throw new BusinessRuleError(
      `O lote "${removedSoldLot.name}" já tem ingressos vendidos e não pode ser removido.`,
    );
  }
}

@Injectable()
export class EventService {
  constructor(
    private readonly repository: EventRepository,
    private readonly categoryRepository: CategoryRepository,
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

    if (
      updateEventDto.startDateTime &&
      updateEventDto.endDateTime &&
      +updateEventDto.startDateTime > +updateEventDto.endDateTime
    ) {
      throw new BusinessRuleError(
        'A data final do evento não pode ser antes da data de início.',
      );
    }

    return this.repository.update(id, updateEventDto);
  }

  async delete(requester: Requester, id: number) {
    const { user_id, active, start_date } = await this.findById(id);

    if (user_id !== requester.id) {
      throw new ForbiddenError('Você não pode deletar um evento que não é seu.');
    }

    // Só um evento que ainda não aconteceu é cancelado (com estorno dos pedidos);
    // apagar um evento passado apenas o esconde
    return this.repository.delete(id, active && start_date > new Date());
  }

  async getLotSales(requester: Requester, eventId: number) {
    const event = await this.findById(eventId);

    if (event.user_id !== requester.id) {
      throw new ForbiddenError('Você só pode ver as vendas dos seus eventos.');
    }

    return buildSectorSales(
      event.sectors,
      await this.repository.getTicketStatsByLot(eventId),
    );
  }

  async getOrganizerMetrics(
    requester: Requester,
    days: MetricsPeriod,
  ): Promise<OrganizerMetrics> {
    if (!canManageEvents(requester.user_type_id)) {
      throw new ForbiddenError('Apenas organizadores têm acesso às métricas.');
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
