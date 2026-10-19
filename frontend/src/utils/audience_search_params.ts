import {
  AUDIENCE_SEGMENT_OPTIONS,
  AUDIENCE_SORT_OPTIONS,
  type AudienceSegment,
  type AudienceSort,
} from '@golden-events/shared';
import { firstValue, type SearchParamValue } from './events_search_params';

// Na mesma ordem em que os filtros montam a URL
export const AUDIENCE_PARAMS = {
  eventId: 'evento',
  search: 'busca',
  segment: 'segmento',
  sort: 'ordenar',
} as const;

export const AUDIENCE_SEGMENTS = {
  returning: 'recorrentes',
  new: 'novos',
} satisfies Record<AudienceSegment, string>;

export const AUDIENCE_SORTS = {
  recent: 'recentes',
  spent: 'maior-gasto',
  events: 'mais-eventos',
} satisfies Record<AudienceSort, string>;

export type AudienceSearchParams = Partial<
  Record<
    (typeof AUDIENCE_PARAMS)[keyof typeof AUDIENCE_PARAMS] | 'pagina',
    SearchParamValue
  >
>;

function fromSlug<T extends string>(
  options: readonly T[],
  slugs: Record<T, string>,
  value?: string,
) {
  return options.find((option) => slugs[option] === value);
}

export function parseAudienceSearchParams(params: AudienceSearchParams) {
  return {
    eventId: Number(firstValue(params.evento)) || undefined,
    search: firstValue(params.busca)?.trim() || undefined,
    segment: fromSlug(
      AUDIENCE_SEGMENT_OPTIONS,
      AUDIENCE_SEGMENTS,
      firstValue(params.segmento),
    ),
    sort:
      fromSlug(
        AUDIENCE_SORT_OPTIONS,
        AUDIENCE_SORTS,
        firstValue(params.ordenar),
      ) ?? 'recent',
    page: Math.max(1, Number(firstValue(params.pagina)) || 1),
  };
}

export function buildAudienceHref(
  path: string,
  params: AudienceSearchParams,
  overrides: Partial<Record<keyof typeof AUDIENCE_PARAMS | 'page', string>>,
) {
  const query = new URLSearchParams();

  for (const [key, param] of Object.entries(AUDIENCE_PARAMS)) {
    const value =
      overrides[key as keyof typeof AUDIENCE_PARAMS] ??
      firstValue(params[param]);

    if (value) {
      query.set(param, value);
    }
  }

  if (overrides.page) {
    query.set('pagina', overrides.page);
  }

  return query.size > 0 ? `${path}?${query}` : path;
}
