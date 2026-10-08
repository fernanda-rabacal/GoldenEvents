import type { Sector } from './lot.js';
import type { User } from './user.js';

export interface EventCategory {
  id: number;
  name: string;
  photo: string;
}

export interface Event {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string;
  start_date: string;
  end_date: string;
  photo: string;
  // Menor preço entre os lotes com estoque, em centavos
  min_price: number;
  category_id: number;
  user_id: number;
  location: string;
  capacity: number;
  active: boolean;
  quantity_left: number;
  created_at: string;
  category?: EventCategory;
  user?: Pick<User, 'id' | 'name'>;
  sectors?: Sector[];
}

export interface PaymentMethod {
  id: number;
  name: string;
}

export type CreateEventProps = Omit<Event, 'id' | 'created_at'>;

export const EVENT_SORT_OPTIONS = ['start_date', 'created_at', 'price'] as const;

export type EventSort = (typeof EVENT_SORT_OPTIONS)[number];
