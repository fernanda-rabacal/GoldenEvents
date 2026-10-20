import { DatabaseError } from '../types/database.error.js';
import { DomainError } from '../types/domain.error.js';
import { PrismaClientError } from '../types/prisma-client.error.js';
import { UniqueConstraintError } from '../types/unique-constraint.error.js';

export enum PrismaErrors {
  UniqueConstraintFail = 'P2002',
}

export const handleDatabaseErrors = (e: PrismaClientError): DomainError => {
  switch (e.code) {
    case PrismaErrors.UniqueConstraintFail:
      return new UniqueConstraintError(e);

    default:
      return new DatabaseError(e.message);
  }
};
