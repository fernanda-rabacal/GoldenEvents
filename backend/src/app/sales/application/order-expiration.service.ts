import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OrderLifecycle, ORDER_TX_OPTIONS } from './order-lifecycle.service.js';
import { OrdersRepository } from '../infra/orders.repository.js';
import { BillingService } from '../../billing/index.js';
import { PrismaService } from '../../../db/prisma.service.js';
import { MaintenanceService } from '../../../shared/messaging/maintenance.service.js';
import { QUEUES, QueueService } from '../../../shared/queue/queue.service.js';

const DAY_MS = 86_400_000;
const OVERDUE_GRACE_MS = 60_000;
const LATE_PAYMENT_LOOKBACK_MS = 7 * DAY_MS;
// Dá tempo para o evento charge_succeeded fazer o trabalho antes da varredura
const LATE_PAYMENT_GRACE_MS = 5 * 60_000;

@Injectable()
export class OrderExpirationService implements OnModuleInit {
  private readonly logger = new Logger(OrderExpirationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: OrdersRepository,
    private readonly lifecycle: OrderLifecycle,
    private readonly billing: BillingService,
    private readonly queues: QueueService,
    private readonly maintenance: MaintenanceService,
  ) {}

  onModuleInit() {
    this.queues.process<{ orderId: string }>(
      QUEUES.orderExpiration,
      job => this.expire(job.data.orderId),
      5,
    );

    this.maintenance.register({
      name: 'overdue-orders',
      run: now => this.expireOverdue(now),
    });
    this.maintenance.register({
      name: 'late-payments',
      run: now => this.settleLatePayments(now),
    });
  }

  // Job atrasado com o tempo exato até expires_at: mais preciso que um job a cada minuto
  async schedule(order: { id: string; expires_at: Date }) {
    try {
      await this.queues.add(
        QUEUES.orderExpiration,
        'expire',
        { orderId: order.id },
        {
          delay: Math.max(0, order.expires_at.getTime() - Date.now()),
          jobId: `expire-${order.id}`,
        },
      );
    } catch (error) {
      this.logger.error(
        `Expiração do pedido ${order.id} não agendada: ${(error as Error).message}`,
      );
    }
  }

  // Antes de expirar, consulta o provedor: se a cobrança já foi paga e só o webhook está
  // atrasado, o pedido é confirmado em vez de expirado
  async expire(orderId: string, now = new Date()) {
    const order = await this.repository.findById(orderId);

    if (order?.status !== 'awaiting_payment' || order.expires_at > now) {
      return;
    }

    await this.lifecycle.closeUnpaid(orderId, 'expired');
  }

  // Cobre jobs de expiração perdidos (ex.: o Redis perdeu a fila)
  private async expireOverdue(now: Date) {
    const orders = await this.repository.findOverdue(
      new Date(now.getTime() - OVERDUE_GRACE_MS),
      100,
    );

    for (const { id } of orders) {
      await this.expire(id, now);
    }
  }

  // Último nível de proteção: cobrança paga de um pedido expirado, sem estorno,
  // cujo evento charge_succeeded se perdeu no caminho
  private async settleLatePayments(now: Date) {
    const orderIds = await this.repository.findExpiredIdsSince(
      new Date(now.getTime() - LATE_PAYMENT_LOOKBACK_MS),
    );

    if (orderIds.length === 0) {
      return;
    }

    const charges = await this.billing.findPaidChargesWithoutRefund(
      'order',
      orderIds,
      new Date(now.getTime() - LATE_PAYMENT_GRACE_MS),
    );

    for (const charge of charges) {
      await this.prisma.$transaction(
        tx =>
          this.lifecycle.confirmPayment(tx, {
            chargeId: charge.id,
            originType: charge.origin_type,
            originId: charge.origin_id,
            amountCents: charge.amount_cents,
          }),
        ORDER_TX_OPTIONS,
      );
    }
  }
}
