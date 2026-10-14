import { Module } from '@nestjs/common';
import { QueueService } from './queue.service.js';

@Module({
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
