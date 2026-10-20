import {
  ArgumentsHost,
  BadGatewayException,
  BadRequestException,
  Catch,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Response } from 'express';
import { BusinessRuleError } from '../types/business-rule.error.js';
import { ConflictError } from '../types/conflict.error.js';
import { DomainError } from '../types/domain.error.js';
import { ForbiddenError } from '../types/forbidden.error.js';
import { NotFoundError } from '../types/not-found.error.js';
import { PaymentProviderError } from '../types/payment-provider.error.js';
import { PrismaClientError } from '../types/prisma-client.error.js';
import { TooManyRequestsError } from '../types/too-many-requests.error.js';
import { UnauthorizedError } from '../types/unauthorized.error.js';
import { handleDatabaseErrors } from '../utils/handle-database-errors.util.js';
import { isPrismaError } from '../utils/is-prisma-error.util.js';

function toHttpException(error: DomainError): HttpException {
  if (error instanceof NotFoundError) return new NotFoundException(error.message);
  if (error instanceof ConflictError) return new ConflictException(error.message);
  if (error instanceof UnauthorizedError) return new UnauthorizedException(error.message);
  if (error instanceof ForbiddenError) return new ForbiddenException(error.message);
  if (error instanceof BusinessRuleError) {
    return new UnprocessableEntityException(error.message);
  }
  if (error instanceof PaymentProviderError) {
    return new BadGatewayException(error.message);
  }
  if (error instanceof TooManyRequestsError) {
    return new HttpException(error.message, HttpStatus.TOO_MANY_REQUESTS);
  }

  return new BadRequestException(error.message);
}

@Catch()
export class DomainErrorFilter extends BaseExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    if (error instanceof TooManyRequestsError) {
      host
        .switchToHttp()
        .getResponse<Response>()
        .setHeader('Retry-After', String(error.retryAfterSeconds));
    }

    if (error instanceof DomainError) {
      return super.catch(toHttpException(error), host);
    }

    if (error instanceof Error && isPrismaError(error as PrismaClientError)) {
      return super.catch(
        toHttpException(handleDatabaseErrors(error as PrismaClientError)),
        host,
      );
    }

    return super.catch(error, host);
  }
}
