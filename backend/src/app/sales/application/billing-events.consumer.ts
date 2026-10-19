import { Injectable, OnModuleInit } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { OrderLifecycle, ORDER_TX_OPTIONS } from './order-lifecycle.service.js';
import { BILLING_EVENTS, type ChargeEventPayload } from '../../billing/index.js';
import { PrismaService } from '../../../db/prisma.service.js';
import {
  DomainEventBus,
  type DomainEventConsumer,
} from '../../../shared/messaging/domain-event-bus.service.js';
import {
  OutboxService,
  type OutboxMessage,
} from '../../../shared/outbox/outbox.service.js';

// Roteamento por origem: a cobrança emite eventos genéricos e vendas fica só com os de pedidos
@Injectable()
export class BillingEventsConsumer implements DomainEventConsumer, OnModuleInit {
  readonly name = 'sales.billing-events';

  private readonly handlers: Record<
    string,
    (tx: Prisma.TransactionClient, payload: ChargeEventPayload) => Promise<void>
  > = {
    [BILLING_EVENTS.chargeSucceeded]: (tx, payload) =>
      this.lifecycle.confirmPayment(tx, payload),
    [BILLING_EVENTS.disputeOpened]: (tx, payload) =>
      this.lifecycle.cancelTicketsForDispute(tx, payload),
  };

  readonly eventTypes = Object.keys(this.handlers);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycle: OrderLifecycle,
    private readonly outbox: OutboxService,
    private readonly bus: DomainEventBus,
  ) {}

  onModuleInit() {
    this.bus.register(this);
  }

  async handle(message: OutboxMessage<ChargeEventPayload>) {
    if (message.payload.originType !== 'order') {
      return;
    }

    // processed_messages na mesma transação do efeito: reentregar nunca paga o pedido duas vezes
    await this.prisma.$transaction(async tx => {
      if (await this.outbox.claim(tx, this.name, message.id)) {
        await this.handlers[message.event_type](tx, message.payload);
      }
    }, ORDER_TX_OPTIONS);
  }
}
