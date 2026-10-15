import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { clientIp } from './client-ip.js';
import { RateLimitService, type RateLimitRule } from './rate-limit.service.js';

export type RouteRateLimit = RateLimitRule & { by: 'ip' | 'user' };

const RATE_LIMIT = 'rate-limit';

// Guards do mesmo método rodam de baixo para cima: para contar antes de outro guard do método
// (ex.: o LocalAuthGuard do login), @RateLimit fica abaixo dele. Por usuário, o JwtAuthGuard
// precisa já ter rodado
export function RateLimit(rule: RouteRateLimit) {
  return applyDecorators(SetMetadata(RATE_LIMIT, rule), UseGuards(RateLimitGuard));
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimit: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const rule = this.reflector.get<RouteRateLimit>(RATE_LIMIT, context.getHandler());
    const request = context.switchToHttp().getRequest<Request>();

    await this.rateLimit.consume(rule, this.subject(rule, request));

    return true;
  }

  private subject(rule: RouteRateLimit, request: Request) {
    if (rule.by === 'ip') {
      return `ip:${clientIp(request)}`;
    }

    const user = request.user as { id: number } | undefined;

    if (!user) {
      throw new Error(
        `O limite ${rule.name} conta por usuário e precisa do JwtAuthGuard.`,
      );
    }

    return `user:${user.id}`;
  }
}
