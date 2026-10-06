import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UserService } from '../user/user.service.js';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../db/prisma.service.js';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategy/local.strategy.js';
import { JwtStrategy } from './strategy/jwt.strategy.js';
import { UserRepository } from '../user/repositories/user.repository.js';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    // O .env é carregado de forma assíncrona; ler o segredo pelo ConfigService garante que ele já exista
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('SECRET'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    AuthService,
    LocalStrategy,
    JwtStrategy,
    UserService,
    UserRepository,
  ],
  exports: [JwtModule],
})
export class AuthModule {}
