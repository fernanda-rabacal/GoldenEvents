import type {
  Event,
  EventCategory,
  EventSort,
  MetricsPeriod,
  OrganizerMetrics,
  Page,
  PaymentMethod,
  SectorSales,
} from '@golden-events/shared';
import { ApiError, fetchFromApi } from './api';
import { fetchWithAuth } from './authenticated-api';

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

  const page = await fetchFromApi<Page<Event>>(`/events?${params}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });

  return {
    events: page.content,
    total: page.totalRecords,
    hasMore: page.totalRecords > page.content.length,
  };
}

export function getEventCategories() {
  return fetchFromApi<EventCategory[]>('/events/categories', {
    next: { revalidate: REVALIDATE_SECONDS },
  });
}

export async function getEventBySlug(
  slug: string,
  init: RequestInit = { next: { revalidate: REVALIDATE_SECONDS } },
) {
  try {
    return await fetchFromApi<Event>(
      `/events/slug/${encodeURIComponent(slug)}`,
      init,
    );
  } catch (error) {
    // Só o 404 vira notFound() na página; as outras falhas vão para a tela de erro
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export function getPaymentMethods() {
  return fetchFromApi<PaymentMethod[]>('/events/payment-methods', {
    next: { revalidate: REVALIDATE_SECONDS },
  });
}

type MyEventsFilters = {
  name?: string;
  categoryId?: number;
  active?: '0' | '1';
  startDate?: string;
  page: number;
  take: number;
};

export function getMyEvents({
  name,
  categoryId,
  active,
  startDate,
  page,
  take,
}: MyEventsFilters) {
  const params = new URLSearchParams({
    skip: String(page - 1),
    take: String(take),
  });

  if (name) {
    params.set('name', name);
  }

  if (categoryId) {
    params.set('category_id', String(categoryId));
  }

  if (active) {
    params.set('active', active);
  }

  if (startDate) {
    params.set('start_date', startDate);
  }

  return fetchWithAuth<Page<Event>>(`/events/me?${params}`);
}

export function getMyMetrics(days: MetricsPeriod) {
  return fetchWithAuth<OrganizerMetrics>(`/events/me/metrics?days=${days}`);
}

export function getEventLotSales(eventId: number) {
  return fetchWithAuth<SectorSales[]>(`/events/${eventId}/lots/sales`);
}
