export const METRICS_PERIOD_OPTIONS = [7, 30] as const;

export type MetricsPeriod = (typeof METRICS_PERIOD_OPTIONS)[number];

// change: variação percentual dos últimos 30 dias sobre os 30 anteriores (null sem base de comparação)
export interface MetricWithChange {
  total: number;
  change: number | null;
}

export interface DailySales {
  date: string;
  tickets: number;
}

export interface OrganizerMetrics {
  ticketsSold: MetricWithChange;
  // Em centavos
  revenue: MetricWithChange;
  audience: MetricWithChange;
  activeEvents: {
    total: number;
    createdThisMonth: number;
  };
  dailySales: DailySales[];
}

export const SALES_PERIOD_OPTIONS = [7, 30, 90] as const;

export type SalesPeriod = (typeof SALES_PERIOD_OPTIONS)[number];

// Pedidos pagos no período (pela data do pagamento). Valores em centavos
export interface OrganizerSalesSummary {
  grossRevenue: number;
  // Bruto menos a taxa da plataforma
  netRevenue: number;
  paidOrders: number;
  ticketsSold: number;
  averageOrder: number;
  refundedOrders: number;
}
