'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/ui/button';
import { EVENTS_PAGE_PATH, HOME_EVENTS_PATH } from '@/utils/events_href';

type SearchFormProps = {
  variant: 'compact' | 'hero';
};

export function SearchForm({ variant }: SearchFormProps) {
  return (
    <Suspense fallback={<SearchFormFields variant={variant} />}>
      <SearchFormWithQuery variant={variant} />
    </Suspense>
  );
}

function SearchFormWithQuery({ variant }: SearchFormProps) {
  const query = useSearchParams()?.get('q') ?? '';

  return (
    <SearchFormFields key={query} variant={variant} defaultValue={query} />
  );
}

type SearchFormFieldsProps = SearchFormProps & {
  defaultValue?: string;
};

function SearchFormFields({ variant, defaultValue }: SearchFormFieldsProps) {
  if (variant === 'compact') {
    return (
      <form
        action={EVENTS_PAGE_PATH}
        method='get'
        role='search'
        className='relative w-full'
      >
        <Search className='absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground/70' />
        <input
          type='search'
          name='q'
          defaultValue={defaultValue}
          aria-label='Buscar eventos'
          placeholder='Buscar eventos, lugares ou experiências'
          className='w-full rounded-full border border-border bg-card py-3 pr-4 pl-11 text-body-sm text-foreground transition outline-none placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/40'
        />
      </form>
    );
  }

  return (
    <form
      action={HOME_EVENTS_PATH}
      method='get'
      role='search'
      className='relative mt-7 max-w-xl'
    >
      <Search className='absolute top-1/2 left-4 size-5 -translate-y-1/2 text-accent-foreground' />
      <input
        type='search'
        name='q'
        defaultValue={defaultValue}
        aria-label='Pesquisar eventos e experiências'
        placeholder='O que você quer viver hoje?'
        className='w-full rounded-2xl border border-input bg-card py-4 pr-28 pl-12 text-body-sm text-foreground shadow-lg shadow-accent-foreground/10 transition outline-none placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/40'
      />
      <Button type='submit' className='absolute top-2.5 right-2.5'>
        Buscar
      </Button>
    </form>
  );
}
