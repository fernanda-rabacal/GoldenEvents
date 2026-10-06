import type { EventSort } from '@golden-events/shared';

export const HOME_EVENTS_PATH = '/#eventos';
export const EVENTS_PAGE_PATH = '/eventos';
export const CHECKOUT_PATH = '/checkout';
export const DEFAULT_EVENT_SORT: EventSort = 'start_date';

export type EventsFilters = {
  query?: string;
  categoryId?: number;
  page?: number;
  sort?: EventSort;
};

export function buildEventsHref(
  { query, categoryId, page, sort }: EventsFilters,
  basePath = HOME_EVENTS_PATH,
) {
  const [pathname, hash] = basePath.split('#');
  const params = new URLSearchParams();

  if (query) {
    params.set('q', query);
  }

  if (categoryId) {
    params.set('categoria', String(categoryId));
  }

  if (sort && sort !== DEFAULT_EVENT_SORT) {
    params.set('ordem', sort);
  }

  if (page && page > 1) {
    params.set('pagina', String(page));
  }

  const search = params.toString();

  return `${pathname}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
}

export function buildEventHref(slug: string) {
  return `${EVENTS_PAGE_PATH}/${slug}`;
}

export function buildCheckoutHref(slug: string, quantity: number) {
  const params = new URLSearchParams({
    evento: slug,
    quantidade: String(quantity),
  });

  return `${CHECKOUT_PATH}?${params}`;
}
