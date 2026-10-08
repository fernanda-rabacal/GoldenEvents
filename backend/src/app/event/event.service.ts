import { Injectable } from '@nestjs/common';
import type { Lot, Sector } from '@prisma/client';
import {
  canManageEvents,
  getCurrentLot,
  type MetricsPeriod,
  type OrganizerMetrics,
} from '@golden-events/shared';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { CreateLotDto } from './dto/lot.dto.js';
import { UpdateSectorDto } from './dto/sector.dto.js';
import { QueryEventDto } from './dto/query-event.dto.js';
import { BuyEventTicketDto } from './dto/buy-ticket.dto.js';
import { CategoryRepository } from './repositories/categories.repository.js';
import { EventRepository } from './repositories/events.repository.js';
import { BusinessRuleError } from '../common/errors/types/BusinessRuleError.js';
import { ForbiddenError } from '../common/errors/types/ForbiddenError.js';
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

const NOT_ENOUGH_TICKETS = 'Não há ingressos suficientes disponíveis para esta compra.';

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
    const { active, start_date, sectors } = await this.findById(buyEventTicket.eventId);

    if (!active) {
      throw new BusinessRuleError('As vendas deste evento estão encerradas.');
    }

    if (start_date <= new Date()) {
      throw new BusinessRuleError(
        'Não é possível comprar ingressos para um evento que já começou.',
      );
    }

    const sector = sectors.find(({ lots }) =>
      lots.some(({ id }) => id === buyEventTicket.lotId),
    );

    if (!sector) {
      throw new NotFoundError('Lote não encontrado.');
    }

    const lot = sector.lots.find(({ id }) => id === buyEventTicket.lotId);
    const currentLot = getCurrentLot(sector.lots);

    if (currentLot.status !== 'on_sale' || currentLot.lot.id !== lot.id) {
      throw new BusinessRuleError('Este lote não está à venda.');
    }

    if (buyEventTicket.quantity > lot.quantity_left) {
      throw new BusinessRuleError(NOT_ENOUGH_TICKETS);
    }

    const tickets = await this.repository.buyTicket(lot, buyEventTicket);

    if (!tickets) {
      throw new BusinessRuleError(NOT_ENOUGH_TICKETS);
    }

    return tickets;
  }

  async update(id: number, userId: number, updateEventDto: UpdateEventDto) {
    const event = await this.findById(id);

    if (userId !== event.user_id) {
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

  async delete(id: number, userId: number) {
    const { user_id } = await this.findById(id);

    if (userId !== user_id) {
      throw new ForbiddenError('Você não pode deletar um evento que não é seu.');
    }

    return this.repository.delete(id);
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
