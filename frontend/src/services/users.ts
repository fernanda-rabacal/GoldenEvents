import type { Event } from '@golden-events/shared';
import { fetchWithAuth } from './authenticated-api';

export type TicketEvent = Pick<
  Event,
  'name' | 'slug' | 'photo' | 'start_date' | 'location'
> & {
  id: number;
  end_date: string | null;
  category: { name: string };
};

export type TicketPurchase = {
  id: number;
  created_at: string;
  lot: { name: string; sector: { name: string } };
};

export type EventTickets = {
  event: TicketEvent;
  quantity: number;
  tickets: TicketPurchase[];
};

export function getMyTickets() {
  return fetchWithAuth<EventTickets[] | null>('/users/me/tickets', null);
}
