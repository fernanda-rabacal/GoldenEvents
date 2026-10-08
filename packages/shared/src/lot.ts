// Valores monetários são sempre inteiros em centavos
export interface Lot {
  id: number;
  sector_id: number;
  name: string;
  price: number;
  quantity: number;
  quantity_left: number;
  position: number;
  sales_start: string | null;
  sales_end: string | null;
}

export interface Sector {
  id: number;
  event_id: number;
  name: string;
  position: number;
  lots: Lot[];
}

export interface LotInput {
  id?: number;
  name: string;
  price: number;
  quantity: number;
  salesStart?: string | null;
  salesEnd?: string | null;
}

export interface SectorInput {
  id?: number;
  name: string;
  lots: LotInput[];
}

export type LotStatus = 'on_sale' | 'not_started' | 'sold_out';

type LotAvailability = Pick<Lot, 'quantity_left' | 'position'> & {
  sales_start: Date | string | null;
  sales_end: Date | string | null;
};

// Virada sequencial: o lote da vez é o primeiro (pela posição) com estoque e vendas não encerradas
export function getCurrentLot<T extends LotAvailability>(
  lots: T[],
  now: Date = new Date(),
): { lot: T | null; status: LotStatus } {
  const lot = [...lots]
    .sort((a, b) => a.position - b.position)
    .find(
      ({ quantity_left, sales_end }) =>
        quantity_left > 0 && (!sales_end || new Date(sales_end) > now),
    );

  if (!lot) {
    return { lot: null, status: 'sold_out' };
  }

  if (lot.sales_start && new Date(lot.sales_start) > now) {
    return { lot, status: 'not_started' };
  }

  return { lot, status: 'on_sale' };
}

// min_price considera só lotes ainda vendáveis no momento da escrita; sem nenhum, usa todos
export function summarizeLots(
  lots: (Pick<Lot, 'price' | 'quantity' | 'quantity_left'> & {
    sales_end?: Date | string | null;
  })[],
  now: Date = new Date(),
) {
  const available = lots.filter(
    ({ quantity_left, sales_end }) =>
      quantity_left > 0 && (!sales_end || new Date(sales_end) > now),
  );
  const prices = (available.length > 0 ? available : lots).map(({ price }) => price);

  return {
    capacity: lots.reduce((total, { quantity }) => total + quantity, 0),
    quantity_left: lots.reduce((total, { quantity_left }) => total + quantity_left, 0),
    min_price: prices.length > 0 ? Math.min(...prices) : 0,
  };
}
