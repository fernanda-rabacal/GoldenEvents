'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ORDER_STATUS_OPTIONS,
  SALES_PERIOD_OPTIONS,
} from '@golden-events/shared';
import { SelectField } from '@/components/form/SelectField';
import { TextField } from '@/components/form/TextField';
import { cn } from '@/lib/utils';
import { ORDER_STATUS } from '@/utils/orders';
import { SALES_PARAMS } from '@/utils/sales_search_params';

type FilterKey = Exclude<keyof typeof SALES_PARAMS, 'tab'>;
type FilterValues = Record<FilterKey, string>;

const DEBOUNCE_IN_MS = 400;

function buildQuery(values: FilterValues, tab: string | null) {
  const params = new URLSearchParams();

  if (tab) {
    params.set(SALES_PARAMS.tab, tab);
  }

  for (const key of Object.keys(values) as FilterKey[]) {
    if (values[key]) {
      params.set(SALES_PARAMS[key], values[key]);
    }
  }

  return params.toString();
}

type SalesFiltersProps = {
  events: { id: number; name: string }[];
  showOrderFilters: boolean;
};

export function SalesFilters({ events, showOrderFilters }: SalesFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [values, setValues] = useState<FilterValues>(() => ({
    eventId: searchParams?.get(SALES_PARAMS.eventId) ?? '',
    period: searchParams?.get(SALES_PARAMS.period) ?? '',
    search: searchParams?.get(SALES_PARAMS.search) ?? '',
    status: searchParams?.get(SALES_PARAMS.status) ?? '',
  }));

  const query = buildQuery(values, searchParams?.get(SALES_PARAMS.tab) ?? null);
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
    <div
      className={cn(
        'mb-6 grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2',
        showOrderFilters && 'lg:grid-cols-4',
      )}
    >
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
      <SelectField
        label='Período'
        value={values.period}
        onChange={(event) => handleChange('period', event.target.value)}
      >
        <option value=''>Desde o início</option>
        {SALES_PERIOD_OPTIONS.map((period) => (
          <option key={period} value={period}>
            Últimos {period} dias
          </option>
        ))}
      </SelectField>
      {showOrderFilters && (
        <>
          <TextField
            label='Comprador'
            type='search'
            placeholder='Nome ou e-mail'
            value={values.search}
            onChange={(event) => handleChange('search', event.target.value)}
          />
          <SelectField
            label='Status'
            value={values.status}
            onChange={(event) => handleChange('status', event.target.value)}
          >
            <option value=''>Todos</option>
            {ORDER_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS[status].label}
              </option>
            ))}
          </SelectField>
        </>
      )}
    </div>
  );
}
