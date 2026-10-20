import { Module } from '@nestjs/common';
import { UserModule } from './user/index.js';
import { PrismaModule } from '../db/prisma.module.js';
import { EventModule } from './event/index.js';
import { AuthModule } from './auth/index.js';
import { BillingModule } from './billing/index.js';
import { SalesModule } from './sales/index.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    UserModule,
    EventModule,
    SalesModule,
    BillingModule,
    PrismaModule,
  ],
})
export class AppModule {}
