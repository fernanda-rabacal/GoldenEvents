import { AdvantagesSection } from '@/components/home/AdvantagesSection';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { CreateEventCta } from '@/components/home/CreateEventCta';
import { EventsSection } from '@/components/home/EventsSection';
import { HeroSection } from '@/components/home/HeroSection';
import { getEventCategories, getUpcomingEvents } from '@/services/events';

const EVENTS_PER_PAGE = 6;

type SearchParamValue = string | string[] | undefined;

type HomePageProps = {
  searchParams: Promise<{
    q?: SearchParamValue;
    categoria?: SearchParamValue;
    pagina?: SearchParamValue;
  }>;
};

function firstValue(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const query = firstValue(params.q)?.trim() || undefined;
  const categoryId = Number(firstValue(params.categoria)) || undefined;
  const page = Math.max(1, Number(firstValue(params.pagina)) || 1);
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
