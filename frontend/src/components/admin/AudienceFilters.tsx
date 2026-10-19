'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SelectField } from '@/components/form/SelectField';
import { TextField } from '@/components/form/TextField';
import {
  AUDIENCE_PARAMS,
  AUDIENCE_SEGMENTS,
  AUDIENCE_SORTS,
} from '@/utils/audience_search_params';

type FilterKey = keyof typeof AUDIENCE_PARAMS;
type FilterValues = Record<FilterKey, string>;

const DEBOUNCE_IN_MS = 400;

function buildQuery(values: FilterValues) {
  const params = new URLSearchParams();

  for (const key of Object.keys(values) as FilterKey[]) {
    if (values[key]) {
      params.set(AUDIENCE_PARAMS[key], values[key]);
    }
  }

  return params.toString();
}

type AudienceFiltersProps = {
  events: { id: number; name: string }[];
};

export function AudienceFilters({ events }: AudienceFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [values, setValues] = useState<FilterValues>(() => ({
    eventId: searchParams?.get(AUDIENCE_PARAMS.eventId) ?? '',
    search: searchParams?.get(AUDIENCE_PARAMS.search) ?? '',
    segment: searchParams?.get(AUDIENCE_PARAMS.segment) ?? '',
    sort: searchParams?.get(AUDIENCE_PARAMS.sort) ?? '',
  }));

  const query = buildQuery(values);
  const currentParams = new URLSearchParams(searchParams?.toString());
  currentParams.delete('pagina');
  const currentQuery = currentParams.toString();

  useEffect(() => {
    if (query === currentQuery) {
      return;
    }

    const timeout = setTimeout(() => {
      router.replace(query ? `${pathname}?${query}` : (pathname ?? ''), {
        scroll: false,
      });
    }, DEBOUNCE_IN_MS);

    return () => clearTimeout(timeout);
  }, [query, currentQuery, pathname, router]);

  function handleChange(key: FilterKey, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className='mb-6 grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4'>
      <SelectField
        label='Evento'
        value={values.eventId}
        onChange={(event) => handleChange('eventId', event.target.value)}
      >
        <option value=''>Todos os eventos</option>
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.name}
          </option>
        ))}
      </SelectField>
      <TextField
        label='Pessoa'
        type='search'
        placeholder='Nome ou e-mail'
        value={values.search}
        onChange={(event) => handleChange('search', event.target.value)}
      />
      <SelectField
        label='Segmento'
        value={values.segment}
        onChange={(event) => handleChange('segment', event.target.value)}
      >
        <option value=''>Todo o público</option>
        <option value={AUDIENCE_SEGMENTS.returning}>
          Recorrentes (2+ eventos)
        </option>
        <option value={AUDIENCE_SEGMENTS.new}>Novos (últimos 30 dias)</option>
      </SelectField>
      <SelectField
        label='Ordenar por'
        value={values.sort}
        onChange={(event) => handleChange('sort', event.target.value)}
      >
        <option value=''>Compra mais recente</option>
        <option value={AUDIENCE_SORTS.spent}>Maior gasto</option>
        <option value={AUDIENCE_SORTS.events}>Mais eventos</option>
      </SelectField>
    </div>
  );
}
