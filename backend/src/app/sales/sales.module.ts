import { Module } from '@nestjs/common';
import { BillingEventsConsumer } from './application/billing-events.consumer.js';
import { EventCancellationConsumer } from './application/event-cancellation.consumer.js';
import { OrderExpirationService } from './application/order-expiration.service.js';
import { OrderLifecycle } from './application/order-lifecycle.service.js';
import { OrdersService } from './application/orders.service.js';
import { OrdersController } from './infra/http/orders.controller.js';
import { OrdersRepository } from './infra/orders.repository.js';
import { BillingModule } from '../billing/index.js';
import { EventModule } from '../event/event.module.js';
import { MessagingModule } from '../../shared/messaging/messaging.module.js';
import { RateLimitModule } from '../../shared/rate-limit/rate-limit.module.js';

@Module({
  imports: [EventModule, BillingModule, MessagingModule, RateLimitModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrdersRepository,
    OrderLifecycle,
    OrderExpirationService,
    BillingEventsConsumer,
    EventCancellationConsumer,
  ],
})
export class SalesModule {}
