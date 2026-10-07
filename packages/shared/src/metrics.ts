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
  revenue: MetricWithChange;
  audience: MetricWithChange;
  activeEvents: {
    total: number;
    createdThisMonth: number;
  };
  dailySales: DailySales[];
}
