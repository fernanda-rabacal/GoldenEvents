import {
  ORDER_STATUS_OPTIONS,
  SALES_PERIOD_OPTIONS,
  type OrderStatus,
  type SalesPeriod,
} from '@golden-events/shared';
import { firstValue, type SearchParamValue } from './events_search_params';

// Na mesma ordem em que os filtros montam a URL
export const SALES_PARAMS = {
  tab: 'aba',
  eventId: 'evento',
  period: 'periodo',
  search: 'busca',
  status: 'status',
} as const;

export const SALES_TABS = ['vendas', 'ingressos'] as const;

export type SalesTab = (typeof SALES_TABS)[number];

export type SalesSearchParams = Partial<
  Record<
    (typeof SALES_PARAMS)[keyof typeof SALES_PARAMS] | 'pagina',
    SearchParamValue
  >
>;

export function parseSalesSearchParams(params: SalesSearchParams) {
  const tab = firstValue(params.aba) as SalesTab;
  const period = Number(firstValue(params.periodo)) as SalesPeriod;
  const status = firstValue(params.status) as OrderStatus;

  return {
    tab: SALES_TABS.includes(tab) ? tab : 'vendas',
    eventId: Number(firstValue(params.evento)) || undefined,
    days: SALES_PERIOD_OPTIONS.includes(period) ? period : undefined,
    search: firstValue(params.busca)?.trim() || undefined,
    status: ORDER_STATUS_OPTIONS.includes(status) ? status : undefined,
    page: Math.max(1, Number(firstValue(params.pagina)) || 1),
  };
}

export function buildSalesHref(
  path: string,
  params: SalesSearchParams,
  overrides: Partial<Record<keyof typeof SALES_PARAMS | 'page', string>>,
) {
  const query = new URLSearchParams();

  for (const [key, param] of Object.entries(SALES_PARAMS)) {
    const value =
      overrides[key as keyof typeof SALES_PARAMS] ?? firstValue(params[param]);

    if (value) {
      query.set(param, value);
    }
  }

  if (overrides.page) {
    query.set('pagina', overrides.page);
  }

  return query.size > 0 ? `${path}?${query}` : path;
}
