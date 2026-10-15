import { Module } from '@nestjs/common';
import { BillingService } from './application/billing.service.js';
import { ChargeLifecycle } from './application/charge-lifecycle.service.js';
import { RefundExecutor } from './application/refund-executor.service.js';
import { WebhookIngestionService } from './application/webhook-ingestion.service.js';
import { WebhookProcessor } from './application/webhook-processor.service.js';
import { PAYMENT_GATEWAYS } from './domain/gateway-port.js';
import { BillingRepository } from './infra/billing.repository.js';
import { FakeGateway } from './infra/gateways/fake.gateway.js';
import { GatewayRegistry } from './infra/gateways/gateway-registry.js';
import { FakeGatewayController } from './infra/http/fake-gateway.controller.js';
import { WebhookController } from './infra/http/webhook.controller.js';
import { WebhookEventsRepository } from './infra/webhook-events.repository.js';
import { MessagingModule } from '../../shared/messaging/messaging.module.js';
import { RateLimitModule } from '../../shared/rate-limit/rate-limit.module.js';

@Module({
  imports: [MessagingModule, RateLimitModule],
  controllers: [WebhookController, FakeGatewayController],
  providers: [
    BillingService,
    BillingRepository,
    ChargeLifecycle,
    RefundExecutor,
    WebhookIngestionService,
    WebhookProcessor,
    WebhookEventsRepository,
    GatewayRegistry,
    FakeGateway,
    {
      provide: PAYMENT_GATEWAYS,
      useFactory: (fake: FakeGateway) => [fake],
      inject: [FakeGateway],
    },
  ],
  exports: [BillingService],
})
export class BillingModule {}
