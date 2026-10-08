import dayjs from 'dayjs';
import {
  getCurrentLot,
  type Event,
  type Lot,
  type LotStatus,
  type Sector,
} from '@golden-events/shared';

const MAX_TICKETS_PER_ORDER = 10;

export type SectorOffer = {
  sector: Sector;
  lot: Lot | null;
  status: LotStatus;
};

export function getSectorOffers(event: Event): SectorOffer[] {
  return (event.sectors ?? []).map((sector) => ({
    sector,
    ...getCurrentLot(sector.lots),
  }));
}

export function getUnavailableReason(event: Event) {
  if (!event.active) {
    return 'Vendas encerradas';
  }

  if (dayjs(event.start_date).isBefore(dayjs())) {
    return 'Evento encerrado';
  }

  const offers = getSectorOffers(event);

  if (offers.some(({ status }) => status === 'on_sale')) {
    return undefined;
  }

  return offers.some(({ status }) => status === 'not_started')
    ? 'Vendas em breve'
    : 'Esgotado';
}

// Só o lote da vez de cada setor pode ser comprado
export function findOfferOnSale(event: Event, lotId: number) {
  return getSectorOffers(event).find(
    ({ lot, status }) => status === 'on_sale' && lot?.id === lotId,
  );
}

export function getMaxTicketQuantity(lot: Pick<Lot, 'quantity_left'>) {
  return Math.max(0, Math.min(lot.quantity_left, MAX_TICKETS_PER_ORDER));
}
