import type { OrderStatus } from '@prisma/client';
import type { Transitions } from '../../../shared/state-machine.js';

export const ORDER_TRANSITIONS: Transitions<OrderStatus> = {
  awaiting_payment: ['paid', 'expired', 'cancelled'],
  // Pagamento tardio que ainda encontrou estoque: o pedido expirado é entregue
  expired: ['paid'],
  paid: ['refunded'],
  cancelled: [],
  refunded: [],
};

export const SALES_EVENTS: Record<Exclude<OrderStatus, 'awaiting_payment'>, string> = {
  paid: 'sales.order_paid',
  expired: 'sales.order_expired',
  cancelled: 'sales.order_cancelled',
  refunded: 'sales.order_refunded',
};
