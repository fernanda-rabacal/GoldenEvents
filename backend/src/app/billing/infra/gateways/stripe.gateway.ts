import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ChargeStatus, DisputeStatus, RefundStatus } from '@prisma/client';
import Stripe from 'stripe';
import type {
  CreateGatewayChargeInput,
  PaymentGateway,
  WebhookEvent,
  WebhookResource,
} from '../../domain/gateway-port.js';
import { UnauthorizedError } from '../../../common/errors/types/UnauthorizedError.js';

export const STRIPE_CLIENT = Symbol('STRIPE_CLIENT');

export const STRIPE_API_VERSION = '2026-09-30.endive';

export function createStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;

  return key ? new Stripe(key, { apiVersion: STRIPE_API_VERSION }) : null;
}

const INTENT_STATUSES: Record<string, ChargeStatus> = {
  requires_confirmation: 'pending',
  requires_action: 'pending',
  processing: 'pending',
  requires_capture: 'authorized',
  succeeded: 'succeeded',
  canceled: 'cancelled',
};

// Uma tentativa recusada devolve a intent para requires_payment_method com o erro
export function toChargeStatus(intent: Stripe.PaymentIntent): ChargeStatus {
  if (intent.status === 'requires_payment_method') {
    return intent.last_payment_error ? 'failed' : 'pending';
  }

  return INTENT_STATUSES[intent.status] ?? 'pending';
}

function toRefundStatus(status: string | null): RefundStatus {
  if (status === 'succeeded') {
    return 'succeeded';
  }

  return status === 'failed' || status === 'canceled' ? 'failed' : 'pending';
}

// warning_closed e prevented terminam sem perda de dinheiro
function toDisputeStatus(status: Stripe.Dispute.Status): DisputeStatus {
  if (status === 'lost') {
    return 'lost';
  }

  return ['won', 'warning_closed', 'prevented'].includes(status) ? 'won' : 'open';
}

function webhookResource(type: string): WebhookResource | null {
  if (type.startsWith('payment_intent.')) {
    return 'charge';
  }

  if (type.startsWith('refund.')) {
    return 'refund';
  }

  return type.startsWith('charge.dispute.') ? 'dispute' : null;
}

function isUnexpectedState(error: unknown) {
  return (
    error instanceof Stripe.errors.StripeInvalidRequestError &&
    error.code === 'payment_intent_unexpected_state'
  );
}

@Injectable()
export class StripeGateway implements PaymentGateway, OnModuleInit {
  readonly provider = 'stripe' as const;

  constructor(@Inject(STRIPE_CLIENT) private readonly stripe: Stripe | null) {}

  onModuleInit() {
    if (process.env.PAYMENT_PROVIDER !== this.provider) {
      return;
    }

    for (const name of ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']) {
      if (!process.env[name]) {
        throw new Error(`${name} é obrigatório com PAYMENT_PROVIDER=stripe.`);
      }
    }
  }

  // Criar e confirmar em chamadas separadas: o retry depois de um timeout reaproveita a
  // mesma intent pela chave de idempotência, mesmo com outro confirmation token
  async createCharge(input: CreateGatewayChargeInput) {
    const created = await this.client.paymentIntents.create(
      {
        amount: input.amountCents,
        currency: input.currency.toLowerCase(),
        metadata: { customer_ref: input.customerRef },
        ...(input.method === 'pix' &&
          input.expiresAt && {
            payment_method_options: {
              pix: { expires_at: Math.floor(input.expiresAt.getTime() / 1000) },
            },
          }),
      },
      { idempotencyKey: input.idempotencyKey },
    );
    const intent = await this.confirm(created.id, input);
    const status = toChargeStatus(intent);

    return {
      providerChargeId: intent.id,
      status,
      pixQrCode: intent.next_action?.pix_display_qr_code?.data,
      clientSecret:
        input.method === 'card' && intent.status === 'requires_action'
          ? (intent.client_secret ?? undefined)
          : undefined,
    };
  }

  async getCharge(providerChargeId: string) {
    const intent = await this.client.paymentIntents.retrieve(providerChargeId);

    return { status: toChargeStatus(intent) };
  }

  async cancelCharge(providerChargeId: string) {
    try {
      await this.client.paymentIntents.cancel(providerChargeId);
    } catch (error) {
      if (!isUnexpectedState(error)) {
        throw error;
      }

      const intent = await this.client.paymentIntents.retrieve(providerChargeId);

      if (intent.status !== 'canceled') {
        throw error;
      }
    }
  }

  async refund(input: {
    providerChargeId: string;
    amountCents: number;
    idempotencyKey: string;
  }) {
    const refund = await this.client.refunds.create(
      { payment_intent: input.providerChargeId, amount: input.amountCents },
      { idempotencyKey: input.idempotencyKey },
    );

    return { providerRefundId: refund.id, status: toRefundStatus(refund.status) };
  }

  async getRefund(providerRefundId: string) {
    const refund = await this.client.refunds.retrieve(providerRefundId);

    return { status: toRefundStatus(refund.status) };
  }

  async getDispute(providerDisputeId: string) {
    const dispute = await this.client.disputes.retrieve(providerDisputeId);
    const intent = dispute.payment_intent;

    if (!intent) {
      throw new Error(`A disputa ${providerDisputeId} não tem PaymentIntent.`);
    }

    return {
      providerChargeId: typeof intent === 'string' ? intent : intent.id,
      status: toDisputeStatus(dispute.status),
      amountCents: dispute.amount,
      reason: dispute.reason,
    };
  }

  verifyWebhook(rawBody: Buffer, headers: Record<string, unknown>) {
    let event: Stripe.Event;

    try {
      event = this.client.webhooks.constructEvent(
        rawBody,
        String(headers['stripe-signature'] ?? ''),
        process.env.STRIPE_WEBHOOK_SECRET ?? '',
      );
    } catch {
      throw new UnauthorizedError('Assinatura do webhook inválida.');
    }

    return this.parseWebhook(event as unknown as Record<string, unknown>);
  }

  // Guarda só os ids: o processador consulta o estado atual, e o objeto completo
  // traz dados que não precisam ficar no banco, como o client_secret
  parseWebhook(payload: Record<string, unknown>): WebhookEvent {
    const type = String(payload.type);
    const object = (payload.data as { object?: { id?: string } } | undefined)?.object;
    const id = String(payload.id);
    const resourceId = String(object?.id);

    return {
      id,
      type,
      resource: webhookResource(type),
      resourceId,
      payload: { id, type, data: { object: { id: resourceId } } },
    };
  }

  private get client() {
    if (!this.stripe) {
      throw new Error('STRIPE_SECRET_KEY ausente.');
    }

    return this.stripe;
  }

  private async confirm(intentId: string, input: CreateGatewayChargeInput) {
    try {
      return await this.client.paymentIntents.confirm(
        intentId,
        input.method === 'pix'
          ? { payment_method_data: { type: 'pix' } }
          : { confirmation_token: input.paymentToken },
      );
    } catch (error) {
      if (error instanceof Stripe.errors.StripeCardError && error.payment_intent) {
        return error.payment_intent;
      }

      // Já confirmada por uma tentativa anterior que ficou sem resposta
      if (isUnexpectedState(error)) {
        return this.client.paymentIntents.retrieve(intentId);
      }

      throw error;
    }
  }
}
