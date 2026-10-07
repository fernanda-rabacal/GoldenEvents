import dayjs from 'dayjs';
import type { TicketEvent } from '@/services/users';

// 42 -> "GLD-00016"
export function formatTicketCode(ticketId: number) {
  return `GLD-${ticketId.toString(36).toUpperCase().padStart(5, '0')}`;
}

export function hasEventEnded(
  event: Pick<TicketEvent, 'start_date' | 'end_date'>,
) {
  return dayjs(event.end_date ?? event.start_date).isBefore(dayjs());
}
