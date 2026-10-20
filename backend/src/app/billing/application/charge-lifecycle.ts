import { Injectable, Logger } from '@nestjs/common';
import type {
  Charge,
  ChargeStatus,
  DisputeStatus,
  Prisma,
  Refund,
  RefundStatus,
} from '@prisma/client';
import {
  CHARGE_TRANSITIONS,
  DISPUTE_TRANSITIONS,
  REFUND_CHARGE_STATUSES,
  REFUND_TRANSITIONS,
} from '../domain/charge-state.js';
import {
  BILLING_EVENTS,
  chargeEventPayload,
  chargeEventType,
  type DisputeEventPayload,
  type RefundEventPayload,
} from '../domain/events.js';
import { BillingRepository } from '../infra/billing.repository.js';
import { InvalidTransitionError } from '../../common/errors/types/invalid-transition.error.js';
import { OutboxService } from '../../../shared/outbox/outbox.service.js';
import { checkTransition } from '../../../shared/state-machine.js';

// Toda mudança de estado da cobrança passa por aqui, sempre com a linha travada
// e o evento gravado no outbox na mesma transação
@Injectable()
export class ChargeLifecycle {
  private readonly logger = new Logger(ChargeLifecycle.name);

  constructor(
    private readonly repository: BillingRepository,
    private readonly outbox: OutboxService,
  ) {}

  // Aplica o status informado pelo provedor. Uma transição inválida para um estado sem
  // dinheiro (o provedor diz failed para uma cobrança que já cancelamos) é ignorada;
  // dinheiro recebido nunca é ignorado
  async reconcile(
    tx: Prisma.TransactionClient,
    charge: Charge,
    providerStatus: ChargeStatus,
  ) {
    if (REFUND_CHARGE_STATUSES.includes(providerStatus)) {
      return charge.status;
    }

    try {
      return await this.apply(tx, charge, providerStatus);
    } catch (error) {
      if (error instanceof InvalidTransitionError && providerStatus !== 'succeeded') {
        this.logger.warn(
          `Cobrança ${charge.id}: ${(error as Error).message} Mantido ${charge.status}.`,
        );

        return charge.status;
      }

      throw error;
    }
  }

  async apply(tx: Prisma.TransactionClient, charge: Charge, to: ChargeStatus) {
    if (!checkTransition('cobrança', CHARGE_TRANSITIONS, charge.status, to)) {
      return charge.status;
    }

    await this.repository.updateCharge(tx, charge.id, { status: to });
    await this.outbox.add(tx, chargeEventType(to), chargeEventPayload(charge));

    return to;
  }

  async applyRefundStatus(
    tx: Prisma.TransactionClient,
    charge: Charge,
    refund: Refund,
    to: RefundStatus,
  ) {
    if (!checkTransition('estorno', REFUND_TRANSITIONS, refund.status, to)) {
      return;
    }

    await this.repository.updateRefund(tx, refund.id, { status: to });

    const payload: RefundEventPayload = {
      ...chargeEventPayload(charge),
      refundId: refund.id,
      reason: refund.reason,
      refundAmountCents: refund.amount_cents,
    };

    if (to === 'failed') {
      this.logger.error(
        `O estorno ${refund.id} falhou no provedor e precisa de ação manual.`,
      );
      await this.outbox.add(tx, BILLING_EVENTS.refundFailed, payload);

      return;
    }

    const refunded = await this.repository.sumRefunds(tx, charge.id, ['succeeded']);

    await this.apply(
      tx,
      charge,
      refunded >= charge.amount_cents ? 'refunded' : 'partially_refunded',
    );
    await this.outbox.add(tx, BILLING_EVENTS.refundSucceeded, payload);
  }

  async syncDispute(
    tx: Prisma.TransactionClient,
    charge: Charge,
    providerDisputeId: string,
    data: { status: DisputeStatus; amountCents: number; reason?: string },
  ) {
    let dispute = await this.repository.findDisputeByProviderId(tx, providerDisputeId);

    if (!dispute) {
      dispute = await this.repository.createDispute(tx, {
        charge_id: charge.id,
        provider_dispute_id: providerDisputeId,
        status: 'open',
        amount_cents: data.amountCents,
        reason: data.reason ?? null,
      });

      await this.outbox.add(tx, BILLING_EVENTS.disputeOpened, {
        ...chargeEventPayload(charge),
        disputeId: dispute.id,
        status: 'open',
      } satisfies DisputeEventPayload);
    }

    if (checkTransition('disputa', DISPUTE_TRANSITIONS, dispute.status, data.status)) {
      await this.repository.updateDispute(tx, dispute.id, { status: data.status });
      await this.outbox.add(tx, BILLING_EVENTS.disputeClosed, {
        ...chargeEventPayload(charge),
        disputeId: dispute.id,
        status: data.status,
      } satisfies DisputeEventPayload);
    }
  }
}
