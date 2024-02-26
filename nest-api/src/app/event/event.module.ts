import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { PrismaService } from 'src/db/prisma.service';
import { CategoryService } from './category.service';

@Module({
  controllers: [EventController],
  providers: [EventService, PrismaService, CategoryService],
})
export class EventModule {}
