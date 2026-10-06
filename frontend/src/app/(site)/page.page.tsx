import { AdvantagesSection } from '@/components/home/AdvantagesSection';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { CreateEventCta } from '@/components/home/CreateEventCta';
import { EventsSection } from '@/components/home/EventsSection';
import { HeroSection } from '@/components/home/HeroSection';
import { getEventCategories, getUpcomingEvents } from '@/services/events';
import {
  type EventsSearchParams,
  parseEventsSearchParams,
} from '@/utils/events_search_params';

const EVENTS_PER_PAGE = 6;

type HomePageProps = {
  searchParams: EventsSearchParams;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { query, categoryId, page } =
    await parseEventsSearchParams(searchParams);
  const hasFilters = Boolean(query || categoryId);

  const [listed, featured, categories] = await Promise.all([
    getUpcomingEvents({
      name: query,
      categoryId,
      take: EVENTS_PER_PAGE * page,
    }),
    hasFilters ? getUpcomingEvents({ take: 1 }) : undefined,
    getEventCategories(),
  ]);

  const [featuredEvent] = (featured ?? listed).events;

  return (
    <main className='overflow-hidden'>
      <HeroSection featuredEvent={featuredEvent} />
      <EventsSection
        events={listed.events}
        categories={categories}
        activeCategoryId={categoryId}
        query={query}
        page={page}
        hasMore={listed.hasMore}
      />
      <CategoriesSection categories={categories} />
      <AdvantagesSection />
      <CreateEventCta />
    </main>
  );
}
