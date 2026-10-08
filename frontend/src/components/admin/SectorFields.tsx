'use client';

import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { TextField } from '@/components/form/TextField';
import { Button } from '@/ui/button';
import { formatMoney } from '@/utils/format_money';
import { maskCurrency } from '@/utils/masks';
import type {
  EventFormValues,
  LotFormValues,
  SectorFormValues,
} from '@/utils/schemaValidations';

export function newLot(name = ''): LotFormValues {
  return {
    sold: 0,
    name,
    price: formatMoney(0),
    quantity: 100,
    salesStart: '',
    salesEnd: '',
  };
}

export function newSector(name = ''): SectorFormValues {
  return { name, lots: [newLot('1º lote')] };
}

type SectorFieldsProps = {
  index: number;
  control: Control<EventFormValues>;
  register: UseFormRegister<EventFormValues>;
  errors?: FieldErrors<SectorFormValues>;
  canRemove: boolean;
  onRemove: () => void;
};

export function SectorFields({
  index,
  control,
  register,
  errors,
  canRemove,
  onRemove,
}: SectorFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sectors.${index}.lots`,
  });
  const hasSales = fields.some(({ sold }) => sold > 0);

  return (
    <div className='flex flex-col gap-5 rounded-2xl border border-border bg-background p-5'>
      <div className='flex items-end gap-3'>
        <div className='flex-1'>
          <TextField
            label='Nome do setor *'
            placeholder='Pista, Camarote, Área VIP...'
            error={errors?.name?.message}
            {...register(`sectors.${index}.name`)}
          />
        </div>
        <Button
          type='button'
          variant='outline'
          size='icon-lg'
          aria-label='Remover setor'
          title={
            hasSales
              ? 'Setores com ingressos vendidos não podem ser removidos'
              : 'Remover setor'
          }
          disabled={!canRemove || hasSales}
          onClick={onRemove}
          className='mb-1'
        >
          <Trash2 />
        </Button>
      </div>

      <ol className='flex flex-col gap-4'>
        {fields.map((field, lotIndex) => {
          const lotErrors = errors?.lots?.[lotIndex];
          const priceField = register(
            `sectors.${index}.lots.${lotIndex}.price`,
          );

          return (
            <li
              key={field.id}
              className='flex flex-col gap-4 rounded-xl border border-border bg-card p-4'
            >
              <div className='flex items-center justify-between gap-3'>
                <p className='text-body-sm font-black text-foreground'>
                  Lote {lotIndex + 1}
                  {field.sold > 0 && (
                    <span className='ml-2 font-bold text-muted-foreground'>
                      · {field.sold} vendidos
                    </span>
                  )}
                </p>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  aria-label={`Remover lote ${lotIndex + 1}`}
                  disabled={fields.length === 1 || field.sold > 0}
                  onClick={() => remove(lotIndex)}
                >
                  <Trash2 />
                </Button>
              </div>

              <div className='grid gap-4 sm:grid-cols-3'>
                <TextField
                  label='Nome do lote *'
                  error={lotErrors?.name?.message}
                  {...register(`sectors.${index}.lots.${lotIndex}.name`)}
                />
                <TextField
                  label='Preço *'
                  inputMode='numeric'
                  error={lotErrors?.price?.message}
                  {...priceField}
                  onChange={(changeEvent) => {
                    changeEvent.target.value = maskCurrency(
                      changeEvent.target.value,
                    );
                    priceField.onChange(changeEvent);
                  }}
                />
                <TextField
                  label='Quantidade *'
                  type='number'
                  min={Math.max(1, field.sold)}
                  error={lotErrors?.quantity?.message}
                  {...register(`sectors.${index}.lots.${lotIndex}.quantity`)}
                />
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <TextField
                  label='Início das vendas (opcional)'
                  type='datetime-local'
                  error={lotErrors?.salesStart?.message}
                  {...register(`sectors.${index}.lots.${lotIndex}.salesStart`)}
                />
                <TextField
                  label='Fim das vendas (opcional)'
                  type='datetime-local'
                  hint='Sem data, o lote vira quando esgotar.'
                  error={lotErrors?.salesEnd?.message}
                  {...register(`sectors.${index}.lots.${lotIndex}.salesEnd`)}
                />
              </div>
            </li>
          );
        })}
      </ol>

      <Button
        type='button'
        variant='outline'
        onClick={() => append(newLot(`${fields.length + 1}º lote`))}
        className='self-start'
      >
        <Plus data-icon='inline-start' /> Adicionar lote
      </Button>
    </div>
  );
}
