import dayjs from 'dayjs';
import type { Event, EventCategory, Page } from '@golden-events/shared';
import { fetchFromApi } from './api';

const REVALIDATE_SECONDS = 60;

type UpcomingEventsFilters = {
  name?: string;
  categoryId?: number;
  take: number;
};

export async function getUpcomingEvents({
  name,
  categoryId,
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

  const page = await fetchFromApi<Page<Event> | null>(
    `/events?${params}`,
    null,
    { next: { revalidate: REVALIDATE_SECONDS } },
  );

  const events = page?.content ?? [];

  return {
    events,
    hasMore: (page?.totalRecords ?? 0) > events.length,
  };
}

export function getEventCategories() {
  return fetchFromApi<EventCategory[]>('/events/categories', [], {
    next: { revalidate: REVALIDATE_SECONDS },
  });
}
