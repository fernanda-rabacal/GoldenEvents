import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { BusinessRuleError } from '../types/BusinessRuleError.js';
import { ConflictError } from '../types/ConflictError.js';
import { DomainError } from '../types/DomainError.js';
import { ForbiddenError } from '../types/ForbiddenError.js';
import { NotFoundError } from '../types/NotFoundError.js';
import { PrismaClientError } from '../types/PrismaClientError.js';
import { UnauthorizedError } from '../types/UnauthorizedError.js';
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

  return new BadRequestException(error.message);
}

@Catch()
export class DomainErrorFilter extends BaseExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
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
