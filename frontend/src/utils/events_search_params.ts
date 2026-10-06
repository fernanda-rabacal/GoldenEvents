import { EVENT_SORT_OPTIONS, type EventSort } from '@golden-events/shared';
import { DEFAULT_EVENT_SORT } from './events_href';

export type SearchParamValue = string | string[] | undefined;

export type EventsSearchParams = Promise<{
  q?: SearchParamValue;
  categoria?: SearchParamValue;
  pagina?: SearchParamValue;
  ordem?: SearchParamValue;
}>;

export function firstValue(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function isEventSort(value?: string): value is EventSort {
  return EVENT_SORT_OPTIONS.includes(value as EventSort);
}

export async function parseEventsSearchParams(
  searchParams: EventsSearchParams,
) {
  const params = await searchParams;
  const sort = firstValue(params.ordem);

  return {
    query: firstValue(params.q)?.trim() || undefined,
    categoryId: Number(firstValue(params.categoria)) || undefined,
    page: Math.max(1, Number(firstValue(params.pagina)) || 1),
    sort: isEventSort(sort) ? sort : DEFAULT_EVENT_SORT,
  };
}
