import { Module } from '@nestjs/common';
import { EventService } from './application/event.service.js';
import { EventController } from './infra/http/event.controller.js';
import { CategoryService } from './application/category.service.js';
import { EventRepository } from './infra/event.repository.js';
import { CategoryRepository } from './infra/category.repository.js';
import { PaymentMethodService } from './application/payment-method.service.js';
import { PaymentMethodRepository } from './infra/payment-method.repository.js';
import { TicketInventoryService } from './application/ticket-inventory.service.js';
import { OutboxModule } from '../../shared/outbox/outbox.module.js';

@Module({
  imports: [OutboxModule],
  controllers: [EventController],
  providers: [
    EventService,
    CategoryService,
    EventRepository,
    CategoryRepository,
    PaymentMethodService,
    PaymentMethodRepository,
    TicketInventoryService,
  ],
  exports: [TicketInventoryService],
})
export class EventModule {}
