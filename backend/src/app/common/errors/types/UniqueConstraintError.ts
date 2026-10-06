import { ConflictError } from './ConflictError.js';
import { PrismaClientError } from './PrismaClientError.js';

const UNIQUE_FIELD_MESSAGES: Record<string, string> = {
  email: 'Já existe uma conta cadastrada com este e-mail.',
  document: 'Já existe uma conta cadastrada com este CPF.',
};

export class UniqueConstraintError extends ConflictError {
  constructor(e: PrismaClientError) {
    // O Prisma informa os campos violados como lista (ex.: ['email'])
    const uniqueFields = ([] as string[]).concat(e.meta?.target ?? []);
    const knownMessage = uniqueFields
      .map(field => UNIQUE_FIELD_MESSAGES[field])
      .find(Boolean);

    super(knownMessage ?? `Já existe um valor para o campo ${uniqueFields.join(', ')}.`);
  }
}
