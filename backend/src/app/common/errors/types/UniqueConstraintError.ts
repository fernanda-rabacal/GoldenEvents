import { ConflictError } from './ConflictError.js';
import { PrismaClientError } from './PrismaClientError.js';

export class UniqueConstraintError extends ConflictError {
  constructor(e: PrismaClientError) {
    const uniqueField = e.meta.target;

    super(`Já existe um valor para o campo ${uniqueField}.`);
  }
}
