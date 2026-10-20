import type { Lot, Sector } from '@prisma/client';
import { getCurrentLot, type LotSalesStatus } from '@golden-events/shared';

export type LotTicketStats = { lotId: number; sold: number; revenue: number };

function getLotSalesStatus(
  lot: Lot,
  currentLotId: number | undefined,
  now: Date,
): LotSalesStatus {
  if (lot.quantity_left === 0) {
    return 'sold_out';
  }

  if (lot.sales_end && lot.sales_end <= now) {
    return 'ended';
  }

  if (lot.id !== currentLotId) {
    return 'queued';
  }

  return lot.sales_start && lot.sales_start > now ? 'scheduled' : 'on_sale';
}

export function buildSectorSales(
  sectors: (Sector & { lots: Lot[] })[],
  stats: LotTicketStats[],
  now = new Date(),
) {
  const statsByLot = new Map(stats.map(stat => [stat.lotId, stat]));

  return sectors.map(sector => {
    const { lot: currentLot } = getCurrentLot(sector.lots, now);

    return {
      id: sector.id,
      name: sector.name,
      lots: sector.lots.map(lot => {
        const { sold, revenue } = statsByLot.get(lot.id) ?? { sold: 0, revenue: 0 };

        return {
          id: lot.id,
          name: lot.name,
          price: lot.price,
          quantity: lot.quantity,
          sold,
          // Saiu do estoque mas ainda não virou ingresso: pedido aguardando pagamento
          reserved: Math.max(0, lot.quantity - lot.quantity_left - sold),
          revenue,
          sales_start: lot.sales_start,
          sales_end: lot.sales_end,
          status: getLotSalesStatus(lot, currentLot?.id, now),
        };
      }),
    };
  });
}
