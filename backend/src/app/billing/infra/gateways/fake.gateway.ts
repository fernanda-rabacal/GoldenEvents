import { Injectable } from '@nestjs/common';
import type { ChargeMethod, ChargeStatus, DisputeStatus } from '@prisma/client';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import type {
  CreateGatewayChargeInput,
  PaymentGateway,
  WebhookEvent,
  WebhookResource,
} from '../../domain/gateway-port.js';
import { BusinessRuleError } from '../../../common/errors/types/business-rule.error.js';
import { NotFoundError } from '../../../common/errors/types/not-found.error.js';
import { UnauthorizedError } from '../../../common/errors/types/unauthorized.error.js';

export const FAKE_DECLINED_CARD_TOKEN = 'tok_declined';
export const FAKE_SIGNATURE_HEADER = 'x-fake-signature';

type FakeCharge = {
  id: string;
  method: ChargeMethod;
  amountCents: number;
  refundedCents: number;
  status: ChargeStatus;
  pixQrCode?: string;
};

type FakeRefund = { id: string; chargeId: string; amountCents: number };

type FakeDispute = {
  id: string;
  chargeId: string;
  amountCents: number;
  status: DisputeStatus;
  reason: string;
};

// Provedor em memória para desenvolvimento e testes. Cartão é aprovado na hora
// (ou recusado com o token tok_declined); Pix fica pendente até simulatePixPayment
@Injectable()
export class FakeGateway implements PaymentGateway {
  readonly provider = 'fake' as const;

  private readonly charges = new Map<string, FakeCharge>();
  private readonly refunds = new Map<string, FakeRefund>();
  private readonly disputes = new Map<string, FakeDispute>();
  private readonly idempotency = new Map<string, string>();

  async createCharge(input: CreateGatewayChargeInput) {
    const existing = this.idempotency.get(`charge:${input.idempotencyKey}`);
    const charge = existing ? this.findCharge(existing) : this.newCharge(input);

    return {
      providerChargeId: charge.id,
      status: charge.status,
      pixQrCode: charge.pixQrCode,
    };
  }

  async getCharge(providerChargeId: string) {
    return { status: this.findCharge(providerChargeId).status };
  }

  async cancelCharge(providerChargeId: string) {
    const charge = this.findCharge(providerChargeId);

    if (charge.status === 'pending' || charge.status === 'authorized') {
      charge.status = 'cancelled';
    }
  }

  async refund(input: {
    providerChargeId: string;
    amountCents: number;
    idempotencyKey: string;
  }) {
    const key = `refund:${input.idempotencyKey}`;
    const existing = this.idempotency.get(key);

    if (existing) {
      return { providerRefundId: existing, status: 'succeeded' as const };
    }

    // A memória do fake não sobrevive a um restart nem conhece as cobranças da seed.
    // O estorno só é pedido para cobranças que o nosso banco já considera pagas
    const charge =
      this.charges.get(input.providerChargeId) ??
      this.adoptPaidCharge(input.providerChargeId, input.amountCents);

    if (charge.status !== 'succeeded' && charge.status !== 'partially_refunded') {
      throw new Error('O provedor fake só estorna cobranças pagas.');
    }

    if (charge.refundedCents + input.amountCents > charge.amountCents) {
      throw new Error('O estorno passa do valor pago.');
    }

    const refund = { id: `fake_re_${randomUUID()}`, chargeId: charge.id, ...input };

    charge.refundedCents += input.amountCents;
    charge.status =
      charge.refundedCents === charge.amountCents ? 'refunded' : 'partially_refunded';
    this.refunds.set(refund.id, refund);
    this.idempotency.set(key, refund.id);

    return { providerRefundId: refund.id, status: 'succeeded' as const };
  }

  async getRefund(providerRefundId: string) {
    if (!this.refunds.has(providerRefundId)) {
      throw new Error('Estorno não encontrado no provedor fake.');
    }

    return { status: 'succeeded' as const };
  }

  async getDispute(providerDisputeId: string) {
    const dispute = this.disputes.get(providerDisputeId);

    if (!dispute) {
      throw new Error('Disputa não encontrada no provedor fake.');
    }

    return {
      providerChargeId: dispute.chargeId,
      status: dispute.status,
      amountCents: dispute.amountCents,
      reason: dispute.reason,
    };
  }

  verifyWebhook(rawBody: Buffer, headers: Record<string, unknown>) {
    const signature = Buffer.from(String(headers[FAKE_SIGNATURE_HEADER] ?? ''));
    const expected = Buffer.from(this.sign(rawBody));

    if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) {
      throw new UnauthorizedError('Assinatura do webhook inválida.');
    }

    return this.parseWebhook(JSON.parse(rawBody.toString('utf8')));
  }

  parseWebhook(payload: Record<string, unknown>): WebhookEvent {
    return {
      id: String(payload.id),
      type: String(payload.type),
      resource: payload.resource as WebhookResource,
      resourceId: String(payload.resourceId),
      payload,
    };
  }

  // Simula o pagador pagando o QR code. Também vale para uma cobrança já cancelada:
  // é o Pix que estava a caminho quando o pedido expirou (pagamento tardio)
  simulatePixPayment(providerChargeId: string) {
    const charge = this.findCharge(providerChargeId);

    if (charge.method !== 'pix') {
      throw new BusinessRuleError('Só cobranças Pix podem ser pagas pela simulação.');
    }

    charge.status = 'succeeded';

    return this.signedWebhook('charge.succeeded', 'charge', charge.id);
  }

  openDispute(providerChargeId: string) {
    const charge = this.findCharge(providerChargeId);
    const dispute: FakeDispute = {
      id: `fake_dp_${randomUUID()}`,
      chargeId: charge.id,
      amountCents: charge.amountCents,
      status: 'open',
      reason: 'fraudulent',
    };

    this.disputes.set(dispute.id, dispute);

    return this.signedWebhook('dispute.created', 'dispute', dispute.id);
  }

  closeDispute(providerDisputeId: string, status: 'won' | 'lost') {
    const dispute = this.disputes.get(providerDisputeId);

    if (!dispute) {
      throw new NotFoundError('Disputa não encontrada no provedor fake.');
    }

    dispute.status = status;

    return this.signedWebhook('dispute.closed', 'dispute', dispute.id);
  }

  signedWebhook(type: string, resource: WebhookResource, resourceId: string) {
    const rawBody = Buffer.from(
      JSON.stringify({ id: `fake_evt_${randomUUID()}`, type, resource, resourceId }),
    );

    return { rawBody, headers: { [FAKE_SIGNATURE_HEADER]: this.sign(rawBody) } };
  }

  sign(rawBody: Buffer) {
    return createHmac('sha256', process.env.FAKE_GATEWAY_WEBHOOK_SECRET ?? 'fake-secret')
      .update(rawBody)
      .digest('hex');
  }

  private newCharge(input: CreateGatewayChargeInput) {
    const id = `fake_ch_${randomUUID()}`;
    const charge: FakeCharge = {
      id,
      method: input.method,
      amountCents: input.amountCents,
      refundedCents: 0,
      status:
        input.method === 'pix'
          ? 'pending'
          : input.paymentToken === FAKE_DECLINED_CARD_TOKEN
            ? 'failed'
            : 'succeeded',
      pixQrCode:
        input.method === 'pix' ? `00020126580014br.gov.bcb.pix-${id}` : undefined,
    };

    this.charges.set(id, charge);
    this.idempotency.set(`charge:${input.idempotencyKey}`, id);

    return charge;
  }

  private adoptPaidCharge(providerChargeId: string, amountCents: number) {
    const charge: FakeCharge = {
      id: providerChargeId,
      method: 'card',
      amountCents,
      refundedCents: 0,
      status: 'succeeded',
    };

    this.charges.set(charge.id, charge);

    return charge;
  }

  private findCharge(providerChargeId: string) {
    const charge = this.charges.get(providerChargeId);

    if (!charge) {
      throw new Error('Cobrança não encontrada no provedor fake.');
    }

    return charge;
  }
}
