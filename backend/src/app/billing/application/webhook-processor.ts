import { Injectable, OnModuleInit } from '@nestjs/common';
import type { PaymentGateway, WebhookResource } from '../domain/gateway-port.js';
import { BillingRepository } from '../infra/billing.repository.js';
import { GatewayRegistry } from '../infra/gateways/gateway-registry.js';
import { WebhookEventsRepository } from '../infra/webhook-events.repository.js';
import { ChargeLifecycle } from './charge-lifecycle.js';
import { WebhookIngestionService } from './webhook-ingestion.service.js';
import { PrismaService } from '../../../db/prisma.service.js';
import { MaintenanceService } from '../../../shared/messaging/maintenance.service.js';
import { QUEUES, QueueService } from '../../../shared/queue/queue.service.js';

const STUCK_WEBHOOK_MS = 2 * 60_000;

// Não confia no payload: consulta o estado atual no provedor, o que resolve eventos
// fora de ordem (um "autorizado" atrasado chegando depois do "pago" não volta o status)
@Injectable()
export class WebhookProcessor implements OnModuleInit {
  private readonly handlers: Record<
    WebhookResource,
    (gateway: PaymentGateway, resourceId: string) => Promise<void>
  > = {
    charge: (gateway, resourceId) => this.syncCharge(gateway, resourceId),
    refund: (gateway, resourceId) => this.syncRefund(gateway, resourceId),
    dispute: (gateway, resourceId) => this.syncDispute(gateway, resourceId),
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookEvents: WebhookEventsRepository,
    private readonly repository: BillingRepository,
    private readonly gateways: GatewayRegistry,
    private readonly lifecycle: ChargeLifecycle,
    private readonly ingestion: WebhookIngestionService,
    private readonly queues: QueueService,
    private readonly maintenance: MaintenanceService,
  ) {}

  onModuleInit() {
    this.queues.process<{ webhookEventId: string }>(
      QUEUES.webhooks,
      job => this.process(job.data.webhookEventId),
      10,
    );

    this.maintenance.register({
      name: 'webhooks',
      run: now => this.requeueUnprocessed(new Date(now.getTime() - STUCK_WEBHOOK_MS)),
    });
  }

  async process(webhookEventId: string) {
    const webhookEvent = await this.webhookEvents.findById(webhookEventId);

    if (!webhookEvent || webhookEvent.processed_at) {
      return;
    }

    await this.webhookEvents.registerAttempt(webhookEventId);

    try {
      const gateway = this.gateways.get(webhookEvent.provider);
      const event = gateway.parseWebhook(webhookEvent.payload as Record<string, unknown>);

      if (event.resource) {
        await this.handlers[event.resource](gateway, event.resourceId);
      }

      await this.webhookEvents.markProcessed(webhookEventId);
    } catch (error) {
      await this.webhookEvents.recordError(webhookEventId, (error as Error).message);
      throw error;
    }
  }

  private async requeueUnprocessed(receivedBefore: Date) {
    const webhookEvents = await this.webhookEvents.findUnprocessedBefore(
      receivedBefore,
      500,
    );

    for (const { id } of webhookEvents) {
      await this.ingestion.enqueue(id);
    }
  }

  private async syncCharge(gateway: PaymentGateway, providerChargeId: string) {
    const charge = await this.repository.findChargeByProviderId(
      gateway.provider,
      providerChargeId,
    );

    // O webhook pode chegar antes de a resposta do createCharge ser gravada: a fila tenta de novo
    if (!charge) {
      throw new Error(`Cobrança ${providerChargeId} ainda não registrada.`);
    }

    const { status } = await gateway.getCharge(providerChargeId);

    await this.prisma.$transaction(async tx =>
      this.lifecycle.reconcile(
        tx,
        await this.repository.lockCharge(tx, charge.id),
        status,
      ),
    );
  }

  private async syncRefund(gateway: PaymentGateway, providerRefundId: string) {
    const refund = await this.repository.findRefundByProviderId(
      gateway.provider,
      providerRefundId,
    );

    if (!refund) {
      throw new Error(`Estorno ${providerRefundId} ainda não registrado.`);
    }

    const { status } = await gateway.getRefund(providerRefundId);

    await this.prisma.$transaction(async tx => {
      const charge = await this.repository.lockCharge(tx, refund.charge_id);
      const current = await this.repository.findRefund(tx, refund.id);

      await this.lifecycle.applyRefundStatus(tx, charge, current, status);
    });
  }

  private async syncDispute(gateway: PaymentGateway, providerDisputeId: string) {
    const dispute = await gateway.getDispute(providerDisputeId);
    const charge = await this.repository.findChargeByProviderId(
      gateway.provider,
      dispute.providerChargeId,
    );

    if (!charge) {
      throw new Error(`Cobrança ${dispute.providerChargeId} da disputa não encontrada.`);
    }

    await this.prisma.$transaction(async tx =>
      this.lifecycle.syncDispute(
        tx,
        await this.repository.lockCharge(tx, charge.id),
        providerDisputeId,
        dispute,
      ),
    );
  }
}
