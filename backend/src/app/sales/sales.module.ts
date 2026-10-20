import { Module } from '@nestjs/common';
import { BillingEventsConsumer } from './application/billing-events.consumer.js';
import { EventCancellationConsumer } from './application/event-cancellation.consumer.js';
import { OrderExpirationService } from './application/order-expiration.service.js';
import { OrderLifecycle } from './application/order-lifecycle.service.js';
import { OrdersService } from './application/orders.service.js';
import { OrganizerMetricsService } from './application/organizer-metrics.service.js';
import { OrganizerSalesService } from './application/organizer-sales.service.js';
import { TicketsService } from './application/tickets.service.js';
import { OrganizerMetricsController } from './infra/http/organizer-metrics.controller.js';
import { OrdersController } from './infra/http/orders.controller.js';
import { TicketsController } from './infra/http/tickets.controller.js';
import { OrdersRepository } from './infra/orders.repository.js';
import { TicketsRepository } from './infra/tickets.repository.js';
import { BillingModule } from '../billing/index.js';
import { EventModule } from '../event/index.js';
import { UserModule } from '../user/index.js';
import { MessagingModule } from '../../shared/messaging/messaging.module.js';
import { RateLimitModule } from '../../shared/rate-limit/rate-limit.module.js';

@Module({
  imports: [EventModule, BillingModule, UserModule, MessagingModule, RateLimitModule],
  controllers: [OrdersController, OrganizerMetricsController, TicketsController],
  providers: [
    OrdersService,
    OrganizerSalesService,
    OrganizerMetricsService,
    TicketsService,
    OrdersRepository,
    TicketsRepository,
    OrderLifecycle,
    OrderExpirationService,
    BillingEventsConsumer,
    EventCancellationConsumer,
  ],
})
export class SalesModule {}
