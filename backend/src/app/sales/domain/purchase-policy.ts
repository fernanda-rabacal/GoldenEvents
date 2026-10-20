import {
  getCurrentLot,
  MAX_TICKETS_PER_BUYER_PER_EVENT,
  MAX_TICKETS_PER_ORDER,
} from '@golden-events/shared';
import { BusinessRuleError } from '../../common/errors/types/business-rule.error.js';
import { NotFoundError } from '../../common/errors/types/not-found.error.js';

export const NOT_ENOUGH_TICKETS =
  'Não há ingressos suficientes disponíveis para esta compra.';

// Cada pedido em aberto prende estoque sem pagar: sem este limite, uma conta esgota o evento
export const OPEN_ORDER_EXISTS =
  'Você já tem um pedido aguardando pagamento para este evento. Pague ou cancele esse pedido antes de fazer outro.';

export const RESERVATION_MINUTES = 10;

// O QR do Pix expira antes da reserva: reduz, mas não elimina, o pagamento tardio
export const PIX_EXPIRY_MARGIN_MS = 60_000;

export const MIN_TIME_TO_PAY_MS = { card: 15_000, pix: PIX_EXPIRY_MARGIN_MS + 30_000 };

// Direito de arrependimento em compras online (CDC, art. 49)
export const BUYER_CANCELLATION_DAYS = 7;

export type RequestedItem = { lotId: number; quantity: number };

export type PricedItem = RequestedItem & { unitPriceCents: number };

type PurchasableLot = {
  id: number;
  price: number;
  quantity_left: number;
  position: number;
  sales_start: Date | null;
  sales_end: Date | null;
};

type PurchasableEvent = {
  active: boolean;
  start_date: Date;
  sectors: { lots: PurchasableLot[] }[];
};

export function checkRequestedItems(items: RequestedItem[]) {
  const lotIds = items.map(({ lotId }) => lotId);

  if (new Set(lotIds).size !== lotIds.length) {
    throw new BusinessRuleError('Cada lote só pode aparecer uma vez no pedido.');
  }

  if (
    items.reduce((total, { quantity }) => total + quantity, 0) > MAX_TICKETS_PER_ORDER
  ) {
    throw new BusinessRuleError(
      `Um pedido pode ter no máximo ${MAX_TICKETS_PER_ORDER} ingressos.`,
    );
  }
}

// heldTickets: ingressos de pedidos pagos e do pedido em aberto do comprador no evento
export function checkTicketsPerBuyer(heldTickets: number, items: RequestedItem[]) {
  const requested = items.reduce((total, { quantity }) => total + quantity, 0);

  if (heldTickets + requested > MAX_TICKETS_PER_BUYER_PER_EVENT) {
    throw new BusinessRuleError(
      `Cada pessoa pode comprar no máximo ${MAX_TICKETS_PER_BUYER_PER_EVENT} ingressos por evento. Você já tem ${heldTickets}.`,
    );
  }
}

// Preço sempre do servidor (do lote no momento da compra), nunca vindo do cliente
export function checkPurchase(
  event: PurchasableEvent,
  items: RequestedItem[],
  now = new Date(),
): PricedItem[] {
  if (!event.active) {
    throw new BusinessRuleError('As vendas deste evento estão encerradas.');
  }

  if (event.start_date <= now) {
    throw new BusinessRuleError(
      'Não é possível comprar ingressos para um evento que já começou.',
    );
  }

  return items.map(({ lotId, quantity }) => {
    const sector = event.sectors.find(({ lots }) => lots.some(({ id }) => id === lotId));

    if (!sector) {
      throw new NotFoundError('Lote não encontrado.');
    }

    const lot = sector.lots.find(({ id }) => id === lotId);
    const currentLot = getCurrentLot(sector.lots, now);

    if (currentLot.status !== 'on_sale' || currentLot.lot.id !== lot.id) {
      throw new BusinessRuleError('Este lote não está à venda.');
    }

    if (quantity > lot.quantity_left) {
      throw new BusinessRuleError(NOT_ENOUGH_TICKETS);
    }

    return { lotId, quantity, unitPriceCents: lot.price };
  });
}

export function calculatePrice(items: PricedItem[]) {
  const subtotalCents = items.reduce(
    (total, { unitPriceCents, quantity }) => total + unitPriceCents * quantity,
    0,
  );

  return { subtotalCents, discountCents: 0, totalCents: subtotalCents };
}

export function checkBuyerCancellation(
  order: { paid_at: Date },
  event: { start_date: Date },
  now = new Date(),
) {
  if (event.start_date <= now) {
    throw new BusinessRuleError(
      'Não é possível cancelar o pedido de um evento que já começou.',
    );
  }

  if (now.getTime() - order.paid_at.getTime() > BUYER_CANCELLATION_DAYS * 86_400_000) {
    throw new BusinessRuleError(
      `O cancelamento só pode ser pedido em até ${BUYER_CANCELLATION_DAYS} dias após a compra.`,
    );
  }
}
