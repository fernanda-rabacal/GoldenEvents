import dayjs from 'dayjs';
import type {
  Event,
  EventCategory,
  EventSort,
  Page,
  PaymentMethod,
} from '@golden-events/shared';
import { fetchFromApi } from './api';

const REVALIDATE_SECONDS = 60;

type UpcomingEventsFilters = {
  name?: string;
  categoryId?: number;
  sort?: EventSort;
  take: number;
};

export async function getUpcomingEvents({
  name,
  categoryId,
  sort,
  take,
}: UpcomingEventsFilters) {
  const params = new URLSearchParams({
    active: '1',
    start_date: dayjs().startOf('day').toISOString(),
    skip: '0',
    take: String(take),
  });

  if (name) {
    params.set('name', name);
  }

  if (categoryId) {
    params.set('category_id', String(categoryId));
  }

  if (sort) {
    params.set('sort', sort);
  }

  const page = await fetchFromApi<Page<Event> | null>(
    `/events?${params}`,
    null,
    { next: { revalidate: REVALIDATE_SECONDS } },
  );

  const events = page?.content ?? [];
  const total = page?.totalRecords ?? 0;

  return {
    events,
    total,
    hasMore: total > events.length,
  };
}

export function getEventCategories() {
  return fetchFromApi<EventCategory[]>('/events/categories', [], {
    next: { revalidate: REVALIDATE_SECONDS },
  });
}

export function getEventBySlug(
  slug: string,
  init: RequestInit = { next: { revalidate: REVALIDATE_SECONDS } },
) {
  return fetchFromApi<Event | null>(
    `/events/slug/${encodeURIComponent(slug)}`,
    null,
    init,
  );
}

export function getPaymentMethods() {
  return fetchFromApi<PaymentMethod[]>('/events/payment-methods', [], {
    next: { revalidate: REVALIDATE_SECONDS },
  });
}
