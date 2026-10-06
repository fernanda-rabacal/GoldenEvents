import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CategoryFilter } from '@/components/events/CategoryFilter';
import { EventCard } from '@/components/events/EventCard';
import { EventSortSelect } from '@/components/events/EventSortSelect';
import { EventsEmptyState } from '@/components/events/EventsEmptyState';
import { LoadMoreLink } from '@/components/events/LoadMoreLink';
import { getEventCategories, getUpcomingEvents } from '@/services/events';
import { EVENTS_PAGE_PATH, buildEventsHref } from '@/utils/events_href';
import {
  type EventsSearchParams,
  parseEventsSearchParams,
} from '@/utils/events_search_params';

const EVENTS_PER_PAGE = 9;

export const metadata: Metadata = {
  title: 'Encontrar eventos',
};

type EventsPageProps = {
  searchParams: EventsSearchParams;
};

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const filters = await parseEventsSearchParams(searchParams);
  const { query, categoryId, page, sort } = filters;

  const [{ events, total, hasMore }, categories] = await Promise.all([
    getUpcomingEvents({
      name: query,
      categoryId,
      sort,
      take: EVENTS_PER_PAGE * page,
    }),
    getEventCategories(),
  ]);

  const activeCategory = categories.find(({ id }) => id === categoryId);
  const hasFilters = Boolean(query || categoryId);

  let title = 'Todos os eventos';
  if (query) {
    title = `Resultados para “${query}”`;
  } else if (activeCategory) {
    title = activeCategory.name;
  }

  return (
    <main className='mx-auto max-w-6xl px-5 py-8 lg:px-8'>
      <nav
        aria-label='Navegação estrutural'
        className='text-body-sm text-muted-foreground mb-8 flex items-center gap-2'
      >
        <Link
          href='/'
          className='hover:text-accent-foreground inline-flex items-center gap-2 transition'
        >
          <ArrowLeft className='size-4' /> Página inicial
        </Link>
        <span>/</span>
        <span className='text-foreground/80'>Encontrar eventos</span>
      </nav>

      <div className='max-w-3xl'>
        <p className='text-body-sm tracking-eyebrow mb-3 font-bold text-orange-500 uppercase'>
          Descubra algo novo
        </p>
        <h1 className='text-h2 text-foreground sm:text-h1'>{title}</h1>
        <p className='text-body text-muted-foreground mt-4'>
          Encontre experiências para viver, compartilhar e guardar na memória.
        </p>
      </div>

      <div className='border-border mt-10 flex flex-col gap-5 border-b pb-5 lg:flex-row lg:items-end lg:justify-between'>
        <div className='min-w-0'>
          <p className='text-body-sm text-foreground/80 mb-3 font-bold'>
            Filtrar por
          </p>
          <CategoryFilter
            inactiveVariant='outline'
            categories={categories}
            activeCategoryId={categoryId}
            getHref={(id) =>
              buildEventsHref(
                { ...filters, categoryId: id, page: undefined },
                EVENTS_PAGE_PATH,
              )
            }
          />
        </div>
        <EventSortSelect value={sort} />
      </div>

      <p className='text-foreground/80 mt-8 text-lg font-bold'>
        {total} {total === 1 ? 'evento encontrado' : 'eventos encontrados'}
      </p>

      {events.length > 0 ? (
        <div className='mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className='mt-6'>
          <EventsEmptyState
            clearFiltersHref={hasFilters ? EVENTS_PAGE_PATH : undefined}
          />
        </div>
      )}

      {hasMore && (
        <LoadMoreLink
          href={buildEventsHref(
            { ...filters, page: page + 1 },
            EVENTS_PAGE_PATH,
          )}
        />
      )}
    </main>
  );
}
