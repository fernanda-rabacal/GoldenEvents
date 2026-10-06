import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { PrismaService } from '../../db/prisma.service.js';
import { JwtStrategy } from '../auth/strategy/jwt.strategy.js';
import { JwtModule } from '@nestjs/jwt';
import { UserRepository } from './repositories/user.repository.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, JwtModule],
  controllers: [UserController],
  providers: [UserService, PrismaService, JwtStrategy, UserRepository],
})
export class UserModule {}
