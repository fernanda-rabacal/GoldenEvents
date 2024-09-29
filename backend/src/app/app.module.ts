import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { PrismaModule } from '../db/prisma.module';
import { EventModule } from './event/event.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [AuthModule, UserModule, EventModule, PrismaModule, ConfigModule.forRoot()],
})
export class AppModule {}
