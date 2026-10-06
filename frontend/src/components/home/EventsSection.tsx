import Link from 'next/link';
import type { Event, EventCategory } from '@golden-events/shared';
import { CategoryFilter } from '@/components/events/CategoryFilter';
import { EventCard } from '@/components/events/EventCard';
import { buildEventsHref } from '@/utils/events_href';
import { SectionHeading } from './SectionHeading';

type EventsSectionProps = {
  events: Event[];
  categories: EventCategory[];
  activeCategoryId?: number;
  query?: string;
  page: number;
  hasMore: boolean;
};

export function EventsSection({
  events,
  categories,
  activeCategoryId,
  query,
  page,
  hasMore,
}: EventsSectionProps) {
  const hasFilters = Boolean(query || activeCategoryId);

  return (
    <section id='eventos' className='bg-card px-5 py-20 lg:px-8'>
      <div className='mx-auto max-w-6xl'>
        <div className='mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end'>
          <SectionHeading
            eyebrow={query ? `Resultados para "${query}"` : 'Na sua agenda'}
            title='Próximos eventos'
          />
          <CategoryFilter
            categories={categories}
            activeCategoryId={activeCategoryId}
            query={query}
          />
        </div>

        {events.length > 0 ? (
          <div className='grid gap-6 md:grid-cols-3'>
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className='rounded-3xl border border-dashed border-border p-10 text-center text-body text-muted-foreground'>
            <p>Nenhum evento encontrado.</p>
            {hasFilters && (
              <Link
                href='/#eventos'
                className='mt-3 inline-block text-body-sm font-bold text-accent-foreground'
              >
                Limpar filtros
              </Link>
            )}
          </div>
        )}

        {hasMore && (
          <div className='mt-10 text-center'>
            <Link
              href={buildEventsHref({
                query,
                categoryId: activeCategoryId,
                page: page + 1,
              })}
              scroll={false}
              className='inline-flex rounded-full border border-input px-6 py-3.5 text-body-sm font-bold text-accent-foreground transition hover:bg-accent'
            >
              Carregar mais
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
