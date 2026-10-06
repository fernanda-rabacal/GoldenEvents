import { UniqueConstraintError } from './UniqueConstraintError.js';
import { PrismaClientError } from './PrismaClientError.js';
import { PrismaErrors } from '../utils/handle-database-errors.util.js';

function prismaUniqueError(target: string | string[]): PrismaClientError {
  return {
    meta: { target },
    code: PrismaErrors.UniqueConstraintFail,
    message: 'Unique constraint failed',
    clientVersion: '5.22.0',
    name: 'PrismaClientKnownRequestError',
    [Symbol.toStringTag]: 'PrismaClientKnownRequestError',
  } as PrismaClientError;
}

describe('UniqueConstraintError', () => {
  it('should use a friendly message for a duplicated e-mail', () => {
    expect(new UniqueConstraintError(prismaUniqueError(['email'])).message).toBe(
      'Já existe uma conta cadastrada com este e-mail.',
    );
  });

  it('should use a friendly message for a duplicated CPF', () => {
    expect(new UniqueConstraintError(prismaUniqueError(['document'])).message).toBe(
      'Já existe uma conta cadastrada com este CPF.',
    );
  });

  it('should accept the target as a string', () => {
    expect(new UniqueConstraintError(prismaUniqueError('email')).message).toBe(
      'Já existe uma conta cadastrada com este e-mail.',
    );
  });

  it('should fall back to a generic message for other fields', () => {
    expect(new UniqueConstraintError(prismaUniqueError(['slug'])).message).toBe(
      'Já existe um valor para o campo slug.',
    );
  });
});
