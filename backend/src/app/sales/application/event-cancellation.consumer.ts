import { Injectable, OnModuleInit } from '@nestjs/common';
import { OrderLifecycle } from './order-lifecycle.service.js';
import { OrdersRepository } from '../infra/orders.repository.js';
import { EVENT_CANCELLED, type EventCancelledPayload } from '../../event/index.js';
import {
  DomainEventBus,
  type DomainEventConsumer,
} from '../../../shared/messaging/domain-event-bus.service.js';
import type { OutboxMessage } from '../../../shared/outbox/outbox.service.js';

const BATCH_SIZE = 100;

// Percorre os pedidos do evento em lotes. Não usa processed_messages: se cair no meio,
// a nova tentativa continua de onde parou, e cada estorno tem chave própria por pedido
@Injectable()
export class EventCancellationConsumer implements DomainEventConsumer, OnModuleInit {
  readonly name = 'sales.event-cancellation';
  readonly eventTypes = [EVENT_CANCELLED];

  constructor(
    private readonly repository: OrdersRepository,
    private readonly lifecycle: OrderLifecycle,
    private readonly bus: DomainEventBus,
  ) {}

  onModuleInit() {
    this.bus.register(this);
  }

  async handle(message: OutboxMessage<EventCancelledPayload>) {
    let cursor: string | undefined;

    for (;;) {
      const orders = await this.repository.findOpenByEvent(
        message.payload.eventId,
        BATCH_SIZE,
        cursor,
      );

      if (orders.length === 0) {
        return;
      }

      for (const order of orders) {
        if (order.status === 'awaiting_payment') {
          await this.lifecycle.closeUnpaid(order.id, 'cancelled');
        } else {
          await this.lifecycle.refundPaid(order.id, 'event_cancelled', {
            releaseStock: false,
          });
        }
      }

      cursor = orders.at(-1).id;
    }
  }
}
