import { Injectable, OnModuleInit } from '@nestjs/common';
import { BILLING_EVENTS, type RefundEventPayload } from '../domain/events.js';
import { BillingRepository } from '../infra/billing.repository.js';
import { GatewayRegistry } from '../infra/gateways/gateway-registry.js';
import { ChargeLifecycle } from './charge-lifecycle.js';
import { PrismaService } from '../../../db/prisma.service.js';
import {
  DomainEventBus,
  type DomainEventConsumer,
} from '../../../shared/messaging/domain-event-bus.js';
import type { OutboxMessage } from '../../../shared/outbox/outbox.service.js';

// Pede o estorno ao provedor. Repetir é seguro: a chave de idempotência do estorno
// é a mesma em todas as tentativas, então o provedor nunca devolve duas vezes
@Injectable()
export class RefundExecutor implements DomainEventConsumer, OnModuleInit {
  readonly name = 'billing.refund-executor';
  readonly eventTypes = [BILLING_EVENTS.refundRequested];

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: BillingRepository,
    private readonly gateways: GatewayRegistry,
    private readonly lifecycle: ChargeLifecycle,
    private readonly bus: DomainEventBus,
  ) {}

  onModuleInit() {
    this.bus.register(this);
  }

  async handle(message: OutboxMessage<RefundEventPayload>) {
    const refund = await this.repository.findRefund(
      this.prisma,
      message.payload.refundId,
    );

    if (!refund || refund.status !== 'pending') {
      return;
    }

    const charge = await this.repository.findCharge(refund.charge_id);
    const gateway = this.gateways.get(charge.provider);
    const result = await gateway.refund({
      providerChargeId: charge.provider_charge_id,
      amountCents: refund.amount_cents,
      idempotencyKey: refund.idempotency_key,
    });

    await this.prisma.$transaction(async tx => {
      const locked = await this.repository.lockCharge(tx, charge.id);
      let current = await this.repository.findRefund(tx, refund.id);

      if (!current.provider_refund_id) {
        current = await this.repository.updateRefund(tx, refund.id, {
          provider_refund_id: result.providerRefundId,
        });
      }

      // Pendente: a confirmação chega por webhook (comum na devolução Pix)
      if (result.status !== 'pending') {
        await this.lifecycle.applyRefundStatus(tx, locked, current, result.status);
      }
    });
  }
}
