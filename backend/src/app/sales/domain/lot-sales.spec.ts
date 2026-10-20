import type { Lot } from '@prisma/client';
import { buildSectorSales } from './lot-sales.js';

const NOW = new Date('2026-10-16T12:00:00Z');
const DAY_MS = 86_400_000;

function buildLot(overrides: Partial<Lot>): Lot {
  return {
    id: 1,
    sector_id: 1,
    name: '1º lote',
    price: 5000,
    quantity: 100,
    quantity_left: 100,
    position: 0,
    sales_start: null,
    sales_end: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function salesFor(lots: Lot[], stats = []) {
  const [sector] = buildSectorSales(
    [{ id: 1, event_id: 1, name: 'Pista', position: 0, lots } as never],
    stats,
    NOW,
  );

  return sector.lots;
}

describe('buildSectorSales', () => {
  it('marks only the current lot as on sale and queues the next ones', () => {
    const lots = salesFor([
      buildLot({ id: 1, quantity_left: 0 }),
      buildLot({ id: 2, position: 1 }),
      buildLot({ id: 3, position: 2 }),
    ]);

    expect(lots.map(({ status }) => status)).toEqual(['sold_out', 'on_sale', 'queued']);
  });

  it('marks a lot whose sales window passed as ended, and one not started as scheduled', () => {
    const lots = salesFor([
      buildLot({ id: 1, sales_end: new Date(NOW.getTime() - DAY_MS) }),
      buildLot({ id: 2, position: 1, sales_start: new Date(NOW.getTime() + DAY_MS) }),
    ]);

    expect(lots.map(({ status }) => status)).toEqual(['ended', 'scheduled']);
  });

  it('splits what left the stock into sold tickets and reservations awaiting payment', () => {
    const [lot] = salesFor([buildLot({ id: 7, quantity: 100, quantity_left: 90 })], [
      { lotId: 7, sold: 6, revenue: 30000 },
    ] as never);

    expect(lot).toMatchObject({ sold: 6, reserved: 4, revenue: 30000 });
  });

  it('reports a lot with no tickets as zero sold', () => {
    const [lot] = salesFor([buildLot({ id: 1 })]);

    expect(lot).toMatchObject({ sold: 0, reserved: 0, revenue: 0 });
  });
});
