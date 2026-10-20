import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { Requester } from './requester.js';
import { UnauthorizedError } from '../errors/types/unauthorized.error.js';

// Usuário que o JwtAuthGuard pôs em req.user. Sem o guard na rota, req.user fica vazio
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Requester => {
    const { user } = context.switchToHttp().getRequest<Request>();

    if (!user) {
      throw new UnauthorizedError('Entre na sua conta para continuar.');
    }

    const { id, user_type_id } = user as Requester;

    return { id, user_type_id };
  },
);
