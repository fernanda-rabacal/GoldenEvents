import type {
  AudienceSegment,
  AudienceSort,
  OrderStatus,
  SalesPeriod,
} from '@golden-events/shared';

// Filtros das vendas do organizador; os DTOs de query implementam estes tipos
type PageQuery = { skip?: number; take?: number };

export type OrganizerSummaryQuery = { event_id?: number; days?: SalesPeriod };

export type OrganizerOrdersQuery = OrganizerSummaryQuery &
  PageQuery & { status?: OrderStatus; search?: string; buyer_id?: number };

export type OrganizerAudienceSummaryQuery = { event_id?: number };

export type OrganizerAudienceQuery = OrganizerAudienceSummaryQuery &
  PageQuery & { search?: string; segment?: AudienceSegment; sort?: AudienceSort };
