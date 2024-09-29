import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../../db/prisma.service';
import { JwtStrategy } from '../auth/strategy/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { UserRepository } from './repositories/user.repository';

@Module({
  imports: [JwtModule],
  controllers: [UserController],
  providers: [UserService, PrismaService, JwtStrategy, UserRepository],
})
export class UserModule {}
