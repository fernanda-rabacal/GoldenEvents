import type { Event, EventCategory } from '@golden-events/shared';
import { CategoryFilter } from '@/components/events/CategoryFilter';
import { EventCard } from '@/components/events/EventCard';
import { EventsEmptyState } from '@/components/events/EventsEmptyState';
import { LoadMoreLink } from '@/components/events/LoadMoreLink';
import { HOME_EVENTS_PATH, buildEventsHref } from '@/utils/events_href';
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
            getHref={(categoryId) => buildEventsHref({ query, categoryId })}
          />
        </div>

        {events.length > 0 ? (
          <div className='grid gap-6 md:grid-cols-3'>
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EventsEmptyState
            clearFiltersHref={hasFilters ? HOME_EVENTS_PATH : undefined}
          />
        )}

        {hasMore && (
          <LoadMoreLink
            href={buildEventsHref({
              query,
              categoryId: activeCategoryId,
              page: page + 1,
            })}
          />
        )}
      </div>
    </section>
  );
}
