import { Module, OnModuleInit } from '@nestjs/common';
import { OutboxModule } from '../outbox/outbox.module.js';
import { QueueModule } from '../queue/queue.module.js';
import { DomainEventBus } from './domain-event-bus.js';
import { MaintenanceService } from './maintenance.service.js';

const STUCK_MESSAGE_MS = 5 * 60_000;

@Module({
  imports: [OutboxModule, QueueModule],
  providers: [DomainEventBus, MaintenanceService],
  exports: [DomainEventBus, MaintenanceService, OutboxModule, QueueModule],
})
export class MessagingModule implements OnModuleInit {
  constructor(
    private readonly bus: DomainEventBus,
    private readonly maintenance: MaintenanceService,
  ) {}

  onModuleInit() {
    this.maintenance.register({
      name: 'outbox',
      run: now =>
        this.bus.republishUnprocessed(new Date(now.getTime() - STUCK_MESSAGE_MS)),
    });
  }
}
