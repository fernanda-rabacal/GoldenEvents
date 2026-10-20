import { Injectable } from '@nestjs/common';
import { TicketsRepository } from '../infra/tickets.repository.js';
import { TicketInventoryService } from '../../event/index.js';

@Injectable()
export class TicketsService {
  constructor(
    private readonly repository: TicketsRepository,
    private readonly inventory: TicketInventoryService,
  ) {}

  // Ingressos do comprador agrupados por evento, na ordem em que foram emitidos
  async findMine(buyerId: number) {
    const tickets = await this.repository.findByBuyer(buyerId);

    if (tickets.length === 0) {
      return [];
    }

    const [events, lots] = await Promise.all([
      this.inventory.findEventSummaries([
        ...new Set(tickets.map(({ event_id }) => event_id)),
      ]),
      this.inventory.findLotLabels([...new Set(tickets.map(({ lot_id }) => lot_id))]),
    ]);
    const eventsById = new Map(events.map(event => [event.id, event]));
    const lotsById = new Map(lots.map(lot => [lot.id, lot]));
    const byEvent = new Map<number, typeof tickets>();

    for (const ticket of tickets) {
      const group = byEvent.get(ticket.event_id) ?? [];

      group.push(ticket);
      byEvent.set(ticket.event_id, group);
    }

    return [...byEvent].map(([eventId, eventTickets]) => ({
      event: eventsById.get(eventId),
      quantity: eventTickets.length,
      tickets: eventTickets.map(({ id, code, status, used_at, created_at, lot_id }) => {
        const lot = lotsById.get(lot_id);

        return {
          id,
          code,
          status,
          used_at,
          created_at,
          lot: { name: lot?.name ?? '', sector: { name: lot?.sector.name ?? '' } },
        };
      }),
    }));
  }
}
