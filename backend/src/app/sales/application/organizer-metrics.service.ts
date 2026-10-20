import { Injectable } from '@nestjs/common';
import {
  canManageEvents,
  type MetricsPeriod,
  type OrganizerMetrics,
} from '@golden-events/shared';
import { buildSectorSales } from '../domain/lot-sales.js';
import { buildOrganizerMetrics, metricsWindows } from '../domain/organizer-metrics.js';
import { TicketsRepository } from '../infra/tickets.repository.js';
import { TicketInventoryService } from '../../event/index.js';
import type { Requester } from '../../common/auth/requester.js';
import { ForbiddenError } from '../../common/errors/types/forbidden.error.js';
import { NotFoundError } from '../../common/errors/types/not-found.error.js';

// Painel de quem organiza: ingressos vendidos nos próprios eventos
@Injectable()
export class OrganizerMetricsService {
  constructor(
    private readonly repository: TicketsRepository,
    private readonly inventory: TicketInventoryService,
  ) {}

  async metrics(requester: Requester, days: MetricsPeriod): Promise<OrganizerMetrics> {
    if (!canManageEvents(requester.user_type_id)) {
      throw new ForbiddenError('Apenas organizadores têm acesso às métricas.');
    }

    const now = new Date();
    const windows = metricsWindows(now, days);
    const eventIds = (await this.inventory.findOrganizerEvents(requester.id)).map(
      ({ id }) => id,
    );

    const [total, current, previous, activeEvents, createdThisMonth, ticketDates] =
      await Promise.all([
        this.repository.summarizeForEvents(eventIds),
        this.repository.summarizeForEvents(eventIds, windows.comparisonStart),
        this.repository.summarizeForEvents(
          eventIds,
          windows.previousStart,
          windows.comparisonStart,
        ),
        this.inventory.countActiveEvents(requester.id, now),
        this.inventory.countActiveEvents(requester.id, now, windows.monthStart),
        this.repository.findDatesForEvents(eventIds, windows.chartStart),
      ]);

    return buildOrganizerMetrics({
      total,
      current,
      previous,
      activeEvents,
      createdThisMonth,
      dateKeys: windows.dateKeys,
      ticketDates,
    });
  }

  async lotSales(requester: Requester, eventId: number) {
    const event = await this.inventory.findEvent(eventId);

    if (!event) {
      throw new NotFoundError('Evento não encontrado');
    }

    if (event.user_id !== requester.id) {
      throw new ForbiddenError('Você só pode ver as vendas dos seus eventos.');
    }

    return buildSectorSales(event.sectors, await this.repository.summarizeByLot(eventId));
  }
}
