'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { EventCategory } from '@golden-events/shared';
import { SelectField } from '@/components/form/SelectField';
import { TextField } from '@/components/form/TextField';

const FILTER_PARAMS = {
  name: 'nome',
  categoryId: 'categoria',
  active: 'ativo',
  startDate: 'data',
} as const;

type FilterKey = keyof typeof FILTER_PARAMS;
type FilterValues = Record<FilterKey, string>;

const DEBOUNCE_IN_MS = 400;

function buildQuery(values: FilterValues) {
  const params = new URLSearchParams();

  for (const key of Object.keys(FILTER_PARAMS) as FilterKey[]) {
    if (values[key]) {
      params.set(FILTER_PARAMS[key], values[key]);
    }
  }

  return params.toString();
}

type MyEventsFiltersProps = {
  categories: EventCategory[];
};

export function MyEventsFilters({ categories }: MyEventsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [values, setValues] = useState<FilterValues>(() => ({
    name: searchParams?.get(FILTER_PARAMS.name) ?? '',
    categoryId: searchParams?.get(FILTER_PARAMS.categoryId) ?? '',
    active: searchParams?.get(FILTER_PARAMS.active) ?? '',
    startDate: searchParams?.get(FILTER_PARAMS.startDate) ?? '',
  }));

  const query = buildQuery(values);
  const currentParams = new URLSearchParams(searchParams?.toString());
  currentParams.delete('pagina');
  const currentQuery = currentParams.toString();

  // Filtros mudam a URL (voltando para a página 1) e o servidor refaz a busca
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
      <TextField
        label='Nome'
        type='search'
        placeholder='Buscar pelo nome'
        value={values.name}
        onChange={(event) => handleChange('name', event.target.value)}
      />
      <SelectField
        label='Categoria'
        value={values.categoryId}
        onChange={(event) => handleChange('categoryId', event.target.value)}
      >
        <option value=''>Todas</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </SelectField>
      <TextField
        label='Começa a partir de'
        type='date'
        value={values.startDate}
        onChange={(event) => handleChange('startDate', event.target.value)}
      />
      <SelectField
        label='Ativo'
        value={values.active}
        onChange={(event) => handleChange('active', event.target.value)}
      >
        <option value=''>Todos</option>
        <option value='1'>Sim</option>
        <option value='0'>Não</option>
      </SelectField>
    </div>
  );
}
