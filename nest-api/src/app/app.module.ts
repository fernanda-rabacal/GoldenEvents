import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { PrismaModule } from '../db/prisma.module';
import { EventModule } from './event/event.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule, UserModule, EventModule, PrismaModule],
})
export class AppModule {}
