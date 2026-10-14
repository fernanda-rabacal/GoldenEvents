import type {
  ChargeOriginType,
  ChargeStatus,
  DisputeStatus,
  RefundReason,
} from '@prisma/client';

export const BILLING_EVENTS = {
  chargeSucceeded: 'billing.charge_succeeded',
  refundRequested: 'billing.refund_requested',
  refundSucceeded: 'billing.refund_succeeded',
  refundFailed: 'billing.refund_failed',
  disputeOpened: 'billing.dispute_opened',
  disputeClosed: 'billing.dispute_closed',
} as const;

export function chargeEventType(status: ChargeStatus) {
  return `billing.charge_${status}`;
}

// Eventos genéricos com a origem: cada módulo escuta e ignora as origens que não são dele
export type ChargeEventPayload = {
  chargeId: string;
  originType: ChargeOriginType;
  originId: string;
  amountCents: number;
};

export type RefundEventPayload = ChargeEventPayload & {
  refundId: string;
  reason: RefundReason;
  refundAmountCents: number;
};

export type DisputeEventPayload = ChargeEventPayload & {
  disputeId: string;
  status: DisputeStatus;
};

export function chargeEventPayload(charge: {
  id: string;
  origin_type: ChargeOriginType;
  origin_id: string;
  amount_cents: number;
}): ChargeEventPayload {
  return {
    chargeId: charge.id,
    originType: charge.origin_type,
    originId: charge.origin_id,
    amountCents: charge.amount_cents,
  };
}
