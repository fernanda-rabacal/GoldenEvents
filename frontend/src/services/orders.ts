import type {
  Order,
  OrderStatus,
  OrganizerOrder,
  OrganizerSalesSummary,
  Page,
  SalesPeriod,
} from '@golden-events/shared';
import { fetchWithAuth } from './authenticated-api';

export function getMyOrders() {
  return fetchWithAuth<Order[]>('/orders');
}

type OrganizerSalesScope = {
  eventId?: number;
  days?: SalesPeriod;
};

type OrganizerOrdersFilters = OrganizerSalesScope & {
  status?: OrderStatus;
  search?: string;
  page: number;
  take: number;
};

function buildScopeParams({ eventId, days }: OrganizerSalesScope) {
  const params = new URLSearchParams();

  if (eventId) {
    params.set('event_id', String(eventId));
  }

  if (days) {
    params.set('days', String(days));
  }

  return params;
}

export function getOrganizerOrders({
  status,
  search,
  page,
  take,
  ...scope
}: OrganizerOrdersFilters) {
  const params = buildScopeParams(scope);

  params.set('skip', String(page - 1));
  params.set('take', String(take));

  if (status) {
    params.set('status', status);
  }

  if (search) {
    params.set('search', search);
  }

  return fetchWithAuth<Page<OrganizerOrder>>(`/orders/organizer?${params}`);
}

export function getOrganizerSalesSummary(scope: OrganizerSalesScope) {
  return fetchWithAuth<OrganizerSalesSummary>(
    `/orders/organizer/summary?${buildScopeParams(scope)}`,
  );
}
