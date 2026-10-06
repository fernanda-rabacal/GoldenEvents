'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { EventSort } from '@golden-events/shared';
import { DEFAULT_EVENT_SORT } from '@/utils/events_href';

const SORT_LABELS: Record<EventSort, string> = {
  start_date: 'Mais próximos',
  created_at: 'Mais recentes',
  price: 'Menor preço',
};

type EventSortSelectProps = {
  value: EventSort;
};

export function EventSortSelect({ value }: EventSortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(sort: EventSort) {
    const params = new URLSearchParams(searchParams?.toString());

    params.delete('pagina');

    if (sort === DEFAULT_EVENT_SORT) {
      params.delete('ordem');
    } else {
      params.set('ordem', sort);
    }

    const search = params.toString();
    router.push(`${pathname}${search ? `?${search}` : ''}`, { scroll: false });
  }

  return (
    <label className='flex shrink-0 items-center gap-3 text-body-sm font-bold text-foreground/80'>
      Ordenar por
      <select
        value={value}
        onChange={(event) => handleChange(event.target.value as EventSort)}
        className='h-8 rounded-lg border border-input bg-background px-2.5 text-sm font-medium text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
      >
        {Object.entries(SORT_LABELS).map(([sort, label]) => (
          <option key={sort} value={sort}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
