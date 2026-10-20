import { Module } from '@nestjs/common';
import { ACCESS_TOKEN_TTL_SECONDS } from '@golden-events/shared';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RefreshTokenRepository } from './repositories/refresh-token.repository.js';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategy/local.strategy.js';
import { JwtStrategy } from './strategy/jwt.strategy.js';
import { UserModule } from '../user/index.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RateLimitModule } from '../../shared/rate-limit/rate-limit.module.js';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    UserModule,
    RateLimitModule,
    // O .env é carregado de forma assíncrona; ler o segredo pelo ConfigService garante que ele já exista
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('SECRET'),
        signOptions: { expiresIn: ACCESS_TOKEN_TTL_SECONDS },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokenRepository, LocalStrategy, JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
