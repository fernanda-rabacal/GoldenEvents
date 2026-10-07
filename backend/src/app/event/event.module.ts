import { Module } from '@nestjs/common';
import { EventService } from './event.service.js';
import { EventController } from './event.controller.js';
import { CategoryService } from './category.service.js';
import { EventRepository } from './repositories/events.repository.js';
import { CategoryRepository } from './repositories/categories.repository.js';
import { PaymentMethodService } from './payment-method.service.js';
import { PaymentMethodRepository } from './repositories/payment-methods.repository.js';

@Module({
  controllers: [EventController],
  providers: [
    EventService,
    CategoryService,
    EventRepository,
    CategoryRepository,
    PaymentMethodService,
    PaymentMethodRepository,
  ],
})
export class EventModule {}
