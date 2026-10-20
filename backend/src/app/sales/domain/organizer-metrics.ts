import type { MetricsPeriod, OrganizerMetrics } from '@golden-events/shared';

export type TicketStats = { tickets: number; revenue: number; audience: number };

const DAY_MS = 24 * 60 * 60 * 1000;
const COMPARISON_DAYS = 30;

// Os dias do gráfico seguem o horário de Brasília, não o UTC do servidor (o Brasil não tem mais horário de verão)
const METRICS_TIME_ZONE = 'America/Sao_Paulo';
const METRICS_UTC_OFFSET = '-03:00';

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: METRICS_TIME_ZONE,
});

// "2026-10-06"
function toDateKey(date: Date) {
  return dateKeyFormatter.format(date);
}

function startOfDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00${METRICS_UTC_OFFSET}`);
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) {
    return null;
  }

  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// Os últimos 30 dias contra os 30 anteriores; o gráfico mostra `days` dias até hoje
export function metricsWindows(now: Date, days: MetricsPeriod) {
  const dateKeys = Array.from({ length: days }, (_, index) =>
    toDateKey(new Date(now.getTime() - (days - 1 - index) * DAY_MS)),
  );

  return {
    dateKeys,
    chartStart: startOfDateKey(dateKeys[0]),
    comparisonStart: new Date(now.getTime() - COMPARISON_DAYS * DAY_MS),
    previousStart: new Date(now.getTime() - 2 * COMPARISON_DAYS * DAY_MS),
    monthStart: startOfDateKey(`${toDateKey(now).slice(0, 7)}-01`),
  };
}

export function buildOrganizerMetrics({
  total,
  current,
  previous,
  activeEvents,
  createdThisMonth,
  dateKeys,
  ticketDates,
}: {
  total: TicketStats;
  current: TicketStats;
  previous: TicketStats;
  activeEvents: number;
  createdThisMonth: number;
  dateKeys: string[];
  ticketDates: Date[];
}): OrganizerMetrics {
  const ticketsByDay = new Map(dateKeys.map(dateKey => [dateKey, 0]));

  for (const date of ticketDates) {
    const dateKey = toDateKey(date);

    if (ticketsByDay.has(dateKey)) {
      ticketsByDay.set(dateKey, ticketsByDay.get(dateKey) + 1);
    }
  }

  return {
    ticketsSold: {
      total: total.tickets,
      change: percentChange(current.tickets, previous.tickets),
    },
    revenue: {
      total: total.revenue,
      change: percentChange(current.revenue, previous.revenue),
    },
    audience: {
      total: total.audience,
      change: percentChange(current.audience, previous.audience),
    },
    activeEvents: { total: activeEvents, createdThisMonth },
    dailySales: dateKeys.map(date => ({ date, tickets: ticketsByDay.get(date) })),
  };
}
