import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module.js';
import { PrismaModule } from '../db/prisma.module.js';
import { EventModule } from './event/event.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule, UserModule, EventModule, PrismaModule],
})
export class AppModule {}
