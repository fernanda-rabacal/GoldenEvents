import type {
  AudienceSegment,
  AudienceSort,
  Order,
  OrderStatus,
  OrganizerAudienceMember,
  OrganizerAudienceSummary,
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
  buyerId?: number;
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
  buyerId,
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

  if (buyerId) {
    params.set('buyer_id', String(buyerId));
  }

  return fetchWithAuth<Page<OrganizerOrder>>(`/orders/organizer?${params}`);
}

export function getOrganizerSalesSummary(scope: OrganizerSalesScope) {
  return fetchWithAuth<OrganizerSalesSummary>(
    `/orders/organizer/summary?${buildScopeParams(scope)}`,
  );
}

export type OrganizerAudienceFilters = {
  eventId?: number;
  search?: string;
  segment?: AudienceSegment;
  sort?: AudienceSort;
  page: number;
  take: number;
};

export function getOrganizerAudience({
  eventId,
  search,
  segment,
  sort,
  page,
  take,
}: OrganizerAudienceFilters) {
  const params = buildScopeParams({ eventId });

  params.set('skip', String(page - 1));
  params.set('take', String(take));

  if (search) {
    params.set('search', search);
  }

  if (segment) {
    params.set('segment', segment);
  }

  if (sort) {
    params.set('sort', sort);
  }

  return fetchWithAuth<Page<OrganizerAudienceMember>>(
    `/orders/organizer/audience?${params}`,
  );
}

export function getOrganizerAudienceSummary(eventId?: number) {
  return fetchWithAuth<OrganizerAudienceSummary>(
    `/orders/organizer/audience/summary?${buildScopeParams({ eventId })}`,
  );
}
