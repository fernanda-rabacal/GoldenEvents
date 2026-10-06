import type { Page } from '@golden-events/shared';
import { fetchFromApi } from './api';
import { fetchWithAuth } from './authenticated-api';

export type UserType = {
  id: number;
  name: string;
};

type UserTicket = {
  id: number;
  price: number;
  quantity: number;
  category: string;
  event: {
    name?: string;
    start_date?: string;
    created_at?: string;
  };
};

export function getUserTypes() {
  return fetchFromApi<UserType[]>('/users/types', [], {
    next: { revalidate: 3600 },
  });
}

export function getUserTickets(userId: number, page: number, take: number) {
  return fetchWithAuth<Page<UserTicket> | null>(
    `/users/tickets/${userId}?take=${take}&skip=${page - 1}`,
    null,
  );
}
