import { DatabaseError } from '../types/DatabaseError.js';
import { DomainError } from '../types/DomainError.js';
import { PrismaClientError } from '../types/PrismaClientError.js';
import { UniqueConstraintError } from '../types/UniqueConstraintError.js';

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
