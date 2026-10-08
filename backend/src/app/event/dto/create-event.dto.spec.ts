import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { CreateEventDto } from './create-event.dto.js';
import { UpdateEventDto } from './update-event.dto.js';

const validLot = { name: '1º lote', price: 4500, quantity: 100 };

function buildEvent(sectors: unknown) {
  return {
    name: 'Teste evento',
    description: 'a'.repeat(100),
    categoryId: 1,
    startDateTime: new Date(Date.now() + 86_400_000).toISOString(),
    location: 'Rua do limoeiro, 12',
    sectors,
  };
}

// Junta as mensagens dos erros aninhados (sectors.0.lots.0.price etc.)
function flattenErrors(errors: ValidationError[], path = ''): string[] {
  return errors.flatMap(error => {
    const property = path ? `${path}.${error.property}` : error.property;

    return [
      ...Object.keys(error.constraints ?? {}).map(() => property),
      ...flattenErrors(error.children ?? [], property),
    ];
  });
}

async function validateSectors(sectors: unknown) {
  const dto = plainToInstance(CreateEventDto, buildEvent(sectors));

  return { dto, errors: flattenErrors(await validate(dto)) };
}

describe('CreateEventDto', () => {
  it('should accept sectors with lots and turn the sales window into dates', async () => {
    const { dto, errors } = await validateSectors([
      {
        name: 'Pista',
        lots: [{ ...validLot, salesStart: '2026-10-10T10:00:00.000Z', salesEnd: null }],
      },
    ]);

    expect(errors).toEqual([]);
    expect(dto.sectors[0].lots[0].salesStart).toEqual(
      new Date('2026-10-10T10:00:00.000Z'),
    );
    expect(dto.sectors[0].lots[0].salesEnd).toBeNull();
  });

  it.each([
    ['no sectors', [], 'sectors'],
    ['a missing sectors list', undefined, 'sectors'],
    ['a sector without lots', [{ name: 'Pista', lots: [] }], 'sectors.0.lots'],
    ['a sector without name', [{ name: '', lots: [validLot] }], 'sectors.0.name'],
    [
      'a lot without name',
      [{ name: 'Pista', lots: [{ ...validLot, name: '' }] }],
      'sectors.0.lots.0.name',
    ],
    [
      'a price in reais',
      [{ name: 'Pista', lots: [{ ...validLot, price: 45.5 }] }],
      'sectors.0.lots.0.price',
    ],
    [
      'a negative price',
      [{ name: 'Pista', lots: [{ ...validLot, price: -1 }] }],
      'sectors.0.lots.0.price',
    ],
    [
      'a lot with no tickets',
      [{ name: 'Pista', lots: [{ ...validLot, quantity: 0 }] }],
      'sectors.0.lots.0.quantity',
    ],
  ])('should reject %s', async (_, sectors, property) => {
    const { errors } = await validateSectors(sectors);

    expect(errors).toContain(property);
  });
});

describe('UpdateEventDto', () => {
  it('should accept an update without sectors', async () => {
    const dto = plainToInstance(UpdateEventDto, { name: 'Novo nome' });

    expect(await validate(dto)).toEqual([]);
  });

  it('should accept the ids of existing sectors and lots', async () => {
    const dto = plainToInstance(UpdateEventDto, {
      sectors: [{ id: 1, name: 'Pista', lots: [{ ...validLot, id: 10 }, validLot] }],
    });

    expect(await validate(dto)).toEqual([]);
  });

  it('should reject an empty sector list', async () => {
    const dto = plainToInstance(UpdateEventDto, { sectors: [] });

    expect(flattenErrors(await validate(dto))).toContain('sectors');
  });
});
