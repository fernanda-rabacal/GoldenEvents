import {
  buildOrganizerMetrics,
  metricsWindows,
  percentChange,
} from './organizer-metrics.js';

const STATS = { tickets: 0, revenue: 0, audience: 0 };

describe('organizer metrics', () => {
  it('should round the change to one decimal, and have none without a previous period', () => {
    expect(percentChange(12, 8)).toBe(50);
    expect(percentChange(1, 3)).toBe(-66.7);
    expect(percentChange(5, 0)).toBeNull();
  });

  it('should count the chart days in Brasília time', () => {
    // 02:00 UTC do dia 16 ainda é dia 15 em Brasília
    const now = new Date('2026-10-16T02:00:00Z');
    const { dateKeys, chartStart, monthStart } = metricsWindows(now, 7);

    expect(dateKeys).toEqual([
      '2026-10-09',
      '2026-10-10',
      '2026-10-11',
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
    ]);
    expect(chartStart).toEqual(new Date('2026-10-09T03:00:00Z'));
    expect(monthStart).toEqual(new Date('2026-10-01T03:00:00Z'));

    const metrics = buildOrganizerMetrics({
      total: STATS,
      current: STATS,
      previous: STATS,
      activeEvents: 0,
      createdThisMonth: 0,
      dateKeys,
      ticketDates: [
        new Date('2026-10-16T01:00:00Z'),
        new Date('2026-10-15T12:00:00Z'),
        new Date('2026-10-09T02:59:00Z'),
      ],
    });

    expect(metrics.dailySales.at(-1)).toEqual({ date: '2026-10-15', tickets: 2 });
    expect(metrics.dailySales.reduce((sum, { tickets }) => sum + tickets, 0)).toBe(2);
  });

  it('should compare the last 30 days with the 30 before them', () => {
    const metrics = buildOrganizerMetrics({
      total: { tickets: 12, revenue: 60000, audience: 3 },
      current: { tickets: 6, revenue: 30000, audience: 1 },
      previous: { tickets: 4, revenue: 0, audience: 2 },
      activeEvents: 5,
      createdThisMonth: 2,
      dateKeys: [],
      ticketDates: [],
    });

    expect(metrics).toEqual({
      ticketsSold: { total: 12, change: 50 },
      revenue: { total: 60000, change: null },
      audience: { total: 3, change: -50 },
      activeEvents: { total: 5, createdThisMonth: 2 },
      dailySales: [],
    });
  });
});
