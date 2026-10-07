'use client';

import { useTransition } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import type { Event, EventCategory } from '@golden-events/shared';
import { ImageUpload } from '@/components/form/ImageUpload';
import { SelectField } from '@/components/form/SelectField';
import { TextField } from '@/components/form/TextField';
import { MY_EVENTS_PATH } from '@/components/layout/nav-links';
import { toastNotify } from '@/lib/toastify';
import {
  createEvent,
  deleteEvent,
  updateEvent,
  type EventPayload,
} from '@/services/event-actions';
import type { ActionResult } from '@/services/authenticated-api';
import { Button } from '@/ui/button';
import { toDateTimeInputValue } from '@/utils/format_date';
import { formatMoney } from '@/utils/format_money';
import { maskCurrency, parseCurrency } from '@/utils/masks';
import { eventValidationSchema } from '@/utils/schemaValidations';

const RichTextEditor = dynamic(
  () => import('@/components/form/RichTextEditor'),
  { ssr: false },
);

type EventFormValues = z.infer<typeof eventValidationSchema>;

type EventFormProps = {
  categories: EventCategory[];
  event?: Event;
};

// O datetime-local não tem fuso: converte no navegador, com o fuso de quem preencheu
function toIsoString(value?: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function toPayload(data: EventFormValues): EventPayload {
  return {
    name: data.name,
    subtitle: data.subtitle || null,
    location: data.location,
    capacity: data.capacity,
    price: parseCurrency(data.price),
    categoryId: data.categoryId,
    description: data.description,
    startDateTime: toIsoString(data.startDateTime)!,
    endDateTime: toIsoString(data.endDateTime),
  };
}

export function EventForm({ categories, event }: EventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(event);
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventValidationSchema),
    defaultValues: {
      name: event?.name ?? '',
      subtitle: event?.subtitle ?? '',
      location: event?.location ?? '',
      capacity: event?.capacity,
      price: formatMoney(event?.price ?? 0),
      categoryId: event?.category_id,
      description: event?.description ?? '',
      photo: event?.photo,
      startDateTime: toDateTimeInputValue(event?.start_date),
      endDateTime: toDateTimeInputValue(event?.end_date),
    },
  });
  const priceField = register('price');

  function runAction(action: () => Promise<ActionResult>) {
    startTransition(async () => {
      const result = await action();

      if (!result.success) {
        toastNotify('error', result.message);
        return;
      }

      toastNotify('success', result.message);
      router.push(MY_EVENTS_PATH);
    });
  }

  function handleSave(data: EventFormValues) {
    if (event && event.quantity_left < event.capacity) {
      toastNotify(
        'error',
        'Você não pode atualizar o evento pois já existem ingressos comprados.',
      );
      return;
    }

    const payload = toPayload(data);

    runAction(() =>
      event ? updateEvent(Number(event.id), payload) : createEvent(payload),
    );
  }

  function handleDelete() {
    const confirmed = window.confirm(
      'Tem certeza de que deseja excluir o evento? Todos os ingressos serão invalidados.',
    );

    if (event && confirmed) {
      runAction(() => deleteEvent(Number(event.id)));
    }
  }

  return (
    <form
      onSubmit={handleSubmit(handleSave)}
      noValidate
      className='flex flex-col gap-8'
    >
      <div className='grid gap-8 rounded-xl border border-border bg-card p-6 lg:grid-cols-[0.9fr_1.1fr]'>
        {/* A API ainda não recebe a foto: o upload só mostra a prévia */}
        <ImageUpload
          label='Foto do evento (PNG ou JPEG de até 2MB)'
          defaultValue={event?.photo}
          onChange={(base64) => setValue('photo', base64)}
        />

        <div className='flex flex-col gap-5'>
          <TextField
            label='Nome do evento *'
            error={errors.name?.message}
            {...register('name')}
          />
          <TextField
            label='Subtítulo (opcional)'
            hint='Uma frase curta que aparece abaixo do nome do evento.'
            error={errors.subtitle?.message}
            {...register('subtitle')}
          />
          <TextField
            label='Local do evento *'
            placeholder='Parque da Cidade, Salvador - BA'
            error={errors.location?.message}
            {...register('location')}
          />
          <div className='grid gap-5 sm:grid-cols-2'>
            <TextField
              label='Capacidade *'
              type='number'
              min={1}
              error={errors.capacity?.message}
              {...register('capacity')}
            />
            <TextField
              label='Preço *'
              inputMode='numeric'
              error={errors.price?.message}
              {...priceField}
              onChange={(changeEvent) => {
                changeEvent.target.value = maskCurrency(
                  changeEvent.target.value,
                );
                priceField.onChange(changeEvent);
              }}
            />
          </div>
          <SelectField
            label='Categoria do evento *'
            error={errors.categoryId?.message}
            {...register('categoryId')}
          >
            <option value=''>Selecione uma categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
          <div className='grid gap-5 sm:grid-cols-2'>
            <TextField
              label='Data de início *'
              type='datetime-local'
              error={errors.startDateTime?.message}
              {...register('startDateTime')}
            />
            <TextField
              label='Data final (opcional)'
              type='datetime-local'
              error={errors.endDateTime?.message}
              {...register('endDateTime')}
            />
          </div>
        </div>
      </div>

      <div className='rounded-xl border border-border bg-card p-6'>
        <RichTextEditor
          label='Descrição do evento (mínimo de 100 caracteres) *'
          markdown={event?.description ?? ''}
          onChange={(markdown) =>
            setValue('description', markdown, { shouldValidate: isSubmitted })
          }
          error={errors.description?.message}
        />
      </div>

      <div className='flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between'>
        {isEditing ? (
          <Button
            type='button'
            variant='destructive'
            size='lg'
            disabled={isPending}
            onClick={handleDelete}
          >
            Excluir evento
          </Button>
        ) : (
          <span />
        )}

        <div className='flex flex-col-reverse gap-3 sm:flex-row'>
          <Button
            type='button'
            variant='outline'
            size='lg'
            disabled={isPending}
            onClick={() => router.back()}
          >
            Voltar
          </Button>
          <Button type='submit' size='lg' disabled={isPending}>
            {isEditing ? 'Atualizar evento' : 'Criar evento'}
          </Button>
        </div>
      </div>
    </form>
  );
}
