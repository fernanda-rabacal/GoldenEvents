import type {
  ChargeMethod,
  ChargeStatus,
  DisputeStatus,
  PaymentProvider,
  RefundStatus,
} from '@prisma/client';

export type WebhookResource = 'charge' | 'refund' | 'dispute';

// Evento já normalizado: o worker só usa o recurso e o id para consultar o estado atual no provedor
export type WebhookEvent = {
  id: string;
  type: string;
  resource: WebhookResource;
  resourceId: string;
  payload: Record<string, unknown>;
};

export type CreateGatewayChargeInput = {
  amountCents: number;
  currency: string;
  method: ChargeMethod;
  customerRef: string;
  paymentToken?: string;
  expiresAt?: Date;
  idempotencyKey: string;
};

// O domínio nunca importa o SDK do provedor: cada provedor é um adaptador desta porta
export interface PaymentGateway {
  readonly provider: PaymentProvider;
  createCharge(
    input: CreateGatewayChargeInput,
  ): Promise<{ providerChargeId: string; status: ChargeStatus; pixQrCode?: string }>;
  getCharge(providerChargeId: string): Promise<{ status: ChargeStatus }>;
  cancelCharge(providerChargeId: string): Promise<void>;
  refund(input: {
    providerChargeId: string;
    amountCents: number;
    idempotencyKey: string;
  }): Promise<{ providerRefundId: string; status: RefundStatus }>;
  getRefund(providerRefundId: string): Promise<{ status: RefundStatus }>;
  getDispute(providerDisputeId: string): Promise<{
    providerChargeId: string;
    status: DisputeStatus;
    amountCents: number;
    reason?: string;
  }>;
  // Lança UnauthorizedError se a assinatura for inválida
  verifyWebhook(rawBody: Buffer, headers: Record<string, unknown>): WebhookEvent;
  parseWebhook(payload: Record<string, unknown>): WebhookEvent;
}

export const PAYMENT_GATEWAYS = Symbol('PAYMENT_GATEWAYS');
