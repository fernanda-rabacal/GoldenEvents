import dayjs from 'dayjs';
import type { Event } from '@golden-events/shared';

export const MAX_TICKETS_PER_ORDER = 10;

export function getUnavailableReason(event: Event) {
  if (!event.active) {
    return 'Vendas encerradas';
  }

  if (dayjs(event.start_date).isBefore(dayjs())) {
    return 'Evento encerrado';
  }

  if (event.quantity_left <= 0) {
    return 'Esgotado';
  }
}

export function getMaxTicketQuantity(event: Event) {
  return Math.max(0, Math.min(event.quantity_left, MAX_TICKETS_PER_ORDER));
}
