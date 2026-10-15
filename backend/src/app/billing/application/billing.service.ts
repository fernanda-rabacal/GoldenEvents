import { Injectable, Logger } from '@nestjs/common';
import type {
  Charge,
  ChargeMethod,
  ChargeOriginType,
  Prisma,
  RefundReason,
} from '@prisma/client';
import { ACTIVE_CHARGE_STATUSES, PAID_CHARGE_STATUSES } from '../domain/charge-state.js';
import { BILLING_EVENTS, chargeEventPayload } from '../domain/events.js';
import { BillingRepository } from '../infra/billing.repository.js';
import { GatewayRegistry } from '../infra/gateways/gateway-registry.js';
import { ChargeLifecycle } from './charge-lifecycle.service.js';
import { PrismaService } from '../../../db/prisma.service.js';
import { OutboxService } from '../../../shared/outbox/outbox.service.js';
import { BusinessRuleError } from '../../common/errors/types/BusinessRuleError.js';
import { ConflictError } from '../../common/errors/types/ConflictError.js';
import { DomainError } from '../../common/errors/types/DomainError.js';
import { PaymentProviderError } from '../../common/errors/types/PaymentProviderError.js';
import {
  RateLimitService,
  type RateLimitRule,
} from '../../../shared/rate-limit/rate-limit.service.js';

const ALREADY_PAID = 'Este pagamento já foi confirmado.';

// Teste de cartão roubado: muitas recusas seguidas. Provedores penalizam o lojista que as acumula
export const DECLINED_CARDS: RateLimitRule = {
  name: 'declined-cards',
  limit: 5,
  windowMs: 60 * 60_000,
  message: 'Muitos cartões recusados. Use o Pix ou aguarde para tentar outro cartão.',
};

export type CreateChargeInput = {
  originType: ChargeOriginType;
  originId: string;
  customerId: number;
  amountCents: number;
  currency: string;
  method: ChargeMethod;
  paymentToken?: string;
  expiresAt?: Date;
};

export type RefundRequest = {
  chargeId: string;
  reason: RefundReason;
  idempotencyKey: string;
  // Sem valor, estorna o que ainda não foi estornado
  amountCents?: number;
};

export type ChargeSummary = Pick<
  Charge,
  | 'id'
  | 'origin_type'
  | 'origin_id'
  | 'method'
  | 'status'
  | 'amount_cents'
  | 'currency'
  | 'pix_qr_code'
  | 'expires_at'
  | 'created_at'
>;

function toSummary(charge: Charge): ChargeSummary {
  return {
    id: charge.id,
    origin_type: charge.origin_type,
    origin_id: charge.origin_id,
    method: charge.method,
    status: charge.status,
    amount_cents: charge.amount_cents,
    currency: charge.currency,
    pix_qr_code: charge.pix_qr_code,
    expires_at: charge.expires_at,
    created_at: charge.created_at,
  };
}

// Fachada pública da cobrança. Não conhece pedidos: só a origem (tipo e id) de cada cobrança
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: BillingRepository,
    private readonly gateways: GatewayRegistry,
    private readonly lifecycle: ChargeLifecycle,
    private readonly outbox: OutboxService,
    private readonly rateLimit: RateLimitService,
  ) {}

  async createCharge(input: CreateChargeInput) {
    // Antes de gravar a cobrança: uma cobrança pendente sem resposta do provedor bloquearia o Pix
    if (input.method === 'card') {
      await this.rateLimit.assertAllowed(DECLINED_CARDS, `customer:${input.customerId}`);
    }

    const charges = await this.repository.findChargesByOrigin(
      input.originType,
      input.originId,
    );

    if (charges.some(({ status }) => PAID_CHARGE_STATUSES.includes(status))) {
      throw new ConflictError(ALREADY_PAID);
    }

    const active = charges.find(({ status }) => ACTIVE_CHARGE_STATUSES.includes(status));

    if (active) {
      // A tentativa anterior ficou sem resposta do provedor: reenviar com a mesma chave não cobra duas vezes
      if (!active.provider_charge_id) {
        return this.submit(active, input);
      }

      if (active.method === 'pix' && input.method === 'pix') {
        return toSummary(active);
      }

      // Troca de forma de pagamento: a cobrança anterior é cancelada no provedor
      if ((await this.cancelCharge(active.id)) === 'succeeded') {
        throw new ConflictError(ALREADY_PAID);
      }
    }

    // Chave derivada do domínio, e não aleatória: um retry depois de um timeout reaproveita a mesma
    const charge = await this.repository.insertChargeIfAbsent({
      origin_type: input.originType,
      origin_id: input.originId,
      customer_id: input.customerId,
      amount_cents: input.amountCents,
      currency: input.currency,
      method: input.method,
      status: 'pending',
      provider: this.gateways.active().provider,
      expires_at: input.expiresAt ?? null,
      idempotency_key: `charge:${input.originType}:${input.originId}:${charges.length + 1}`,
    });

    return this.submit(charge, input);
  }

  async listCharges(originType: ChargeOriginType, originId: string) {
    const charges = await this.repository.findChargesByOrigin(originType, originId);

    return charges.map(toSummary);
  }

  async findActiveCharge(originType: ChargeOriginType, originId: string) {
    const charges = await this.listCharges(originType, originId);

    return charges.find(({ status }) => ACTIVE_CHARGE_STATUSES.includes(status)) ?? null;
  }

  // Consulta o provedor e aplica o estado atual: cobre um webhook atrasado ou perdido
  async refreshFromProvider(chargeId: string) {
    const charge = await this.repository.findCharge(chargeId);

    if (!charge.provider_charge_id) {
      return charge.status;
    }

    const gateway = this.gateways.get(charge.provider);
    const { status } = await this.callProvider(() =>
      gateway.getCharge(charge.provider_charge_id),
    );

    return this.prisma.$transaction(async tx =>
      this.lifecycle.reconcile(
        tx,
        await this.repository.lockCharge(tx, chargeId),
        status,
      ),
    );
  }

  // Devolve o status final: succeeded quando o pagamento chegou antes do cancelamento
  async cancelCharge(chargeId: string) {
    const status = await this.refreshFromProvider(chargeId);

    if (!ACTIVE_CHARGE_STATUSES.includes(status)) {
      return status;
    }

    const charge = await this.repository.findCharge(chargeId);

    if (charge.provider_charge_id) {
      const gateway = this.gateways.get(charge.provider);

      await this.callProvider(() => gateway.cancelCharge(charge.provider_charge_id));
    }

    return this.prisma.$transaction(async tx =>
      this.lifecycle.reconcile(
        tx,
        await this.repository.lockCharge(tx, chargeId),
        'cancelled',
      ),
    );
  }

  // Antes de fechar uma origem sem pagamento: consulta o provedor e cancela o que está em aberto.
  // paid = true quando algum pagamento já chegou (só o evento estava atrasado)
  async cancelOpenCharges(originType: ChargeOriginType, originId: string) {
    const charges = await this.repository.findChargesByOrigin(originType, originId);
    let paid = charges.some(({ status }) => PAID_CHARGE_STATUSES.includes(status));

    for (const charge of charges) {
      if (
        ACTIVE_CHARGE_STATUSES.includes(charge.status) &&
        (await this.cancelCharge(charge.id)) === 'succeeded'
      ) {
        paid = true;
      }
    }

    return { paid };
  }

  // Roda na transação de quem pede: o estorno só existe se a mudança que o motivou existir.
  // A chamada ao provedor acontece depois, pelo consumidor de billing.refund_requested
  async requestRefund(tx: Prisma.TransactionClient, request: RefundRequest) {
    const charge = await this.repository.lockCharge(tx, request.chargeId);
    const existing = await this.repository.findRefundByKey(tx, request.idempotencyKey);

    if (existing) {
      return existing.id;
    }

    if (!PAID_CHARGE_STATUSES.includes(charge.status)) {
      throw new BusinessRuleError('Só é possível estornar uma cobrança paga.');
    }

    const committed = await this.repository.sumRefunds(tx, charge.id, [
      'pending',
      'succeeded',
    ]);
    const amountCents = request.amountCents ?? charge.amount_cents - committed;

    if (amountCents <= 0 || committed + amountCents > charge.amount_cents) {
      throw new BusinessRuleError('O valor do estorno passa do valor pago.');
    }

    const refund = await this.repository.createRefund(tx, {
      charge_id: charge.id,
      amount_cents: amountCents,
      reason: request.reason,
      status: 'pending',
      idempotency_key: request.idempotencyKey,
    });

    await this.outbox.add(tx, BILLING_EVENTS.refundRequested, {
      ...chargeEventPayload(charge),
      refundId: refund.id,
      reason: refund.reason,
      refundAmountCents: refund.amount_cents,
    });

    return refund.id;
  }

  async findPaidChargesWithoutRefund(
    originType: ChargeOriginType,
    originIds: string[],
    updatedBefore: Date,
  ) {
    const charges = await this.repository.findPaidChargesWithoutRefund(
      originType,
      originIds,
      updatedBefore,
    );

    return charges.map(toSummary);
  }

  private async submit(charge: Charge, input: CreateChargeInput) {
    if (charge.method !== input.method) {
      throw new ConflictError(
        'O pagamento anterior ainda está sendo processado. Tente novamente em instantes.',
      );
    }

    const gateway = this.gateways.get(charge.provider);
    const result = await this.callProvider(() =>
      gateway.createCharge({
        amountCents: charge.amount_cents,
        currency: charge.currency,
        method: charge.method,
        customerRef: String(charge.customer_id),
        paymentToken: input.paymentToken,
        expiresAt: charge.expires_at ?? undefined,
        idempotencyKey: charge.idempotency_key,
      }),
    );

    const summary = await this.prisma.$transaction(async tx => {
      let current = await this.repository.lockCharge(tx, charge.id);

      if (!current.provider_charge_id) {
        current = await this.repository.updateCharge(tx, charge.id, {
          provider_charge_id: result.providerChargeId,
          pix_qr_code: result.pixQrCode ?? null,
        });
      }

      const status = await this.lifecycle.reconcile(tx, current, result.status);

      return toSummary({ ...current, status });
    });

    if (summary.method === 'card' && summary.status === 'failed') {
      await this.rateLimit.recordFailure(
        DECLINED_CARDS,
        `customer:${charge.customer_id}`,
      );
    }

    return summary;
  }

  private async callProvider<T>(call: () => Promise<T>) {
    try {
      return await call();
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }

      this.logger.error(
        `Falha ao chamar o provedor de pagamento: ${(error as Error).message}`,
      );
      throw new PaymentProviderError(
        'Não foi possível falar com o provedor de pagamento. Tente novamente.',
      );
    }
  }
}
