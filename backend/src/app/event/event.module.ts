import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { PrismaService } from '../../db/prisma.service';
import { CategoryService } from './category.service';
import { EventRepository } from './repositories/events.repository';
import { CategoryRepository } from './repositories/categories.repository';

@Module({
  controllers: [EventController],
  providers: [EventService, PrismaService, CategoryService, EventRepository, CategoryRepository],
})
export class EventModule {}
