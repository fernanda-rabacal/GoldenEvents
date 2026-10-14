import type { ChargeStatus, DisputeStatus, RefundStatus } from '@prisma/client';
import type { Transitions } from '../../../shared/state-machine.js';

export const CHARGE_TRANSITIONS: Transitions<ChargeStatus> = {
  pending: ['authorized', 'succeeded', 'failed', 'cancelled'],
  authorized: ['succeeded', 'cancelled', 'failed'],
  succeeded: ['partially_refunded', 'refunded'],
  partially_refunded: ['partially_refunded', 'refunded'],
  // O provedor é a fonte da verdade do dinheiro: um Pix pago depois do cancelamento local
  // (pagamento tardio) precisa virar charge_succeeded para que vendas entregue ou estorne
  cancelled: ['succeeded'],
  failed: [],
  refunded: [],
};

export const ACTIVE_CHARGE_STATUSES: readonly ChargeStatus[] = ['pending', 'authorized'];

export const PAID_CHARGE_STATUSES: readonly ChargeStatus[] = [
  'succeeded',
  'partially_refunded',
];

// Estornos andam pelos registros de refund, não pelo status que o provedor mostra na cobrança
export const REFUND_CHARGE_STATUSES: readonly ChargeStatus[] = [
  'refunded',
  'partially_refunded',
];

export const REFUND_TRANSITIONS: Transitions<RefundStatus> = {
  pending: ['succeeded', 'failed'],
  succeeded: [],
  failed: [],
};

export const DISPUTE_TRANSITIONS: Transitions<DisputeStatus> = {
  open: ['won', 'lost'],
  won: [],
  lost: [],
};
