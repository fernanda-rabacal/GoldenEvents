import { Injectable } from '@nestjs/common';
import { canManageEvents, type OrganizerSalesSummary } from '@golden-events/shared';
import {
  QueryOrganizerOrdersDto,
  QueryOrganizerSummaryDto,
} from '../infra/http/dto/query-organizer-sales.dto.js';
import { OrdersRepository } from '../infra/orders.repository.js';
import { BillingService } from '../../billing/index.js';
import { TicketInventoryService } from '../../event/ticket-inventory.service.js';
import { ForbiddenError } from '../../common/errors/types/ForbiddenError.js';
import { UserService, type Requester } from '../../user/user.service.js';
import { OffsetPagination } from '../../../response/pagination.response.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function sinceDays(days?: number) {
  return days ? new Date(Date.now() - days * DAY_MS) : undefined;
}

// Vendas vistas por quem organiza: só pedidos dos próprios eventos
@Injectable()
export class OrganizerSalesService {
  constructor(
    private readonly repository: OrdersRepository,
    private readonly inventory: TicketInventoryService,
    private readonly billing: BillingService,
    private readonly users: UserService,
  ) {}

  async listOrders(requester: Requester, query: QueryOrganizerOrdersDto) {
    const { events, eventIds } = await this.resolveScope(requester, query.event_id);
    const search = query.search?.trim();
    const buyerIds = search ? await this.users.findIdsMatching(search) : undefined;

    if (eventIds.length === 0 || buyerIds?.length === 0) {
      return new OffsetPagination(0, 0, query.skip, query.take).buildPage([]);
    }

    const { skip, take } = new OffsetPagination(
      0,
      0,
      query.skip,
      query.take,
    ).filterProps();
    const [total, orders] = await this.repository.findPageForEvents(
      {
        eventIds,
        buyerIds,
        status: query.status,
        createdSince: sinceDays(query.days),
      },
      skip,
      take,
    );

    if (orders.length === 0) {
      return new OffsetPagination(total, total, query.skip, query.take).buildPage([]);
    }

    const [buyers, lots, methods] = await Promise.all([
      this.users.findContacts([...new Set(orders.map(({ buyer_id }) => buyer_id))]),
      this.inventory.findLotLabels([
        ...new Set(orders.flatMap(({ items }) => items.map(({ lot_id }) => lot_id))),
      ]),
      this.billing.findMethodsByChargeIds(
        orders.flatMap(({ paid_charge_id }) => paid_charge_id ?? []),
      ),
    ]);

    const eventsById = new Map(events.map(event => [event.id, event]));
    const buyersById = new Map(buyers.map(buyer => [buyer.id, buyer]));
    const lotsById = new Map(lots.map(lot => [lot.id, lot]));

    return new OffsetPagination(total, total, query.skip, query.take).buildPage(
      orders.map(order => ({
        id: order.id,
        status: order.status,
        event: eventsById.get(order.event_id),
        buyer: buyersById.get(order.buyer_id) ?? {
          id: order.buyer_id,
          name: 'Conta removida',
          email: '',
        },
        method: (order.paid_charge_id && methods.get(order.paid_charge_id)) || null,
        ticket_count: order.items.reduce((sum, { quantity }) => sum + quantity, 0),
        subtotal_cents: order.subtotal_cents,
        discount_cents: order.discount_cents,
        total_cents: order.total_cents,
        platform_fee_cents: order.platform_fee_cents,
        created_at: order.created_at,
        paid_at: order.paid_at,
        items: order.items.map(item => ({
          lot_id: item.lot_id,
          lot_name: lotsById.get(item.lot_id)?.name ?? '',
          sector_name: lotsById.get(item.lot_id)?.sector.name ?? '',
          quantity: item.quantity,
          unit_price_cents: item.unit_price_cents,
          tickets: item.tickets,
        })),
      })),
    );
  }

  async summarize(
    requester: Requester,
    query: QueryOrganizerSummaryDto,
  ): Promise<OrganizerSalesSummary> {
    const { eventIds } = await this.resolveScope(requester, query.event_id);
    const totals =
      eventIds.length > 0
        ? await this.repository.summarizeForEvents(eventIds, sinceDays(query.days))
        : {
            paidOrders: 0,
            totalCents: 0,
            feeCents: 0,
            ticketsSold: 0,
            refundedOrders: 0,
          };

    return {
      grossRevenue: totals.totalCents,
      netRevenue: totals.totalCents - totals.feeCents,
      paidOrders: totals.paidOrders,
      ticketsSold: totals.ticketsSold,
      averageOrder:
        totals.paidOrders > 0 ? Math.round(totals.totalCents / totals.paidOrders) : 0,
      refundedOrders: totals.refundedOrders,
    };
  }

  private async resolveScope(requester: Requester, eventId?: number) {
    if (!canManageEvents(requester.user_type_id)) {
      throw new ForbiddenError('Apenas organizadores têm acesso às vendas.');
    }

    const events = await this.inventory.findOrganizerEvents(requester.id);

    if (eventId === undefined) {
      return { events, eventIds: events.map(({ id }) => id) };
    }

    if (!events.some(({ id }) => id === eventId)) {
      throw new ForbiddenError('Você só pode ver as vendas dos seus eventos.');
    }

    return { events, eventIds: [eventId] };
  }
}
