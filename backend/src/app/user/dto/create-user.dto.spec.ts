import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto.js';

async function validateDocument(document: unknown) {
  const dto = plainToInstance(CreateUserDto, {
    name: 'Teste usuário',
    email: 'emailteste@email.com',
    password: '123456',
    document,
  });
  const errors = await validate(dto);

  return { dto, documentErrors: errors.filter(error => error.property === 'document') };
}

describe('CreateUserDto', () => {
  it('should accept a CPF with only digits', async () => {
    const { dto, documentErrors } = await validateDocument('12345678901');

    expect(documentErrors).toHaveLength(0);
    expect(dto.document).toBe('12345678901');
  });

  it('should remove the mask from a formatted CPF', async () => {
    const { dto, documentErrors } = await validateDocument('123.456.789-01');

    expect(documentErrors).toHaveLength(0);
    expect(dto.document).toBe('12345678901');
  });

  it.each(['1234567890', '123456789012', '123.456.789', '', 'abcdefghijk'])(
    'should reject the invalid CPF "%s"',
    async document => {
      const { documentErrors } = await validateDocument(document);

      expect(documentErrors).toHaveLength(1);
    },
  );

  it('should reject a CPF that is not a string', async () => {
    const { documentErrors } = await validateDocument(12345678901);

    expect(documentErrors).toHaveLength(1);
  });
});
