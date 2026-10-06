import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin } from 'lucide-react';
import { DetailsSection } from '@/components/event-details/DetailsSection';
import { EventDescription } from '@/components/event-details/EventDescription';
import { EventLocationCard } from '@/components/event-details/EventLocationCard';
import { EventPolicy } from '@/components/event-details/EventPolicy';
import { EventPurchaseCard } from '@/components/event-details/EventPurchaseCard';
import { OrganizerCard } from '@/components/event-details/OrganizerCard';
import { getEventBySlug, getPaymentMethods } from '@/services/events';
import { getUnavailableReason } from '@/utils/event_availability';
import { EVENTS_PAGE_PATH, buildEventsHref } from '@/utils/events_href';

const PHOTO_PLACEHOLDER = '/images/photo-placeholder.jpg';

type EventDetailsPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: EventDetailsPageProps): Promise<Metadata> {
  const event = await getEventBySlug((await params).slug);

  if (!event) {
    return {};
  }

  return {
    title: event.name,
    description: event.description.split('\n').find(Boolean)?.slice(0, 160),
  };
}

export default async function EventDetailsPage({
  params,
}: EventDetailsPageProps) {
  const { slug } = await params;
  const [event, paymentMethods] = await Promise.all([
    getEventBySlug(slug),
    getPaymentMethods(),
  ]);

  if (!event) {
    notFound();
  }

  return (
    <main className='mx-auto max-w-6xl px-5 py-8 lg:px-8'>
      <Link
        href={EVENTS_PAGE_PATH}
        className='inline-flex items-center gap-2 text-body-sm font-bold text-muted-foreground transition hover:text-accent-foreground'
      >
        <ArrowLeft className='size-4' /> Voltar para eventos
      </Link>

      <div className='mt-7 grid gap-10 lg:grid-cols-[1.35fr_.85fr] lg:items-start'>
        <div>
          <div className='overflow-hidden rounded-4xl bg-primary shadow-sm'>
            <img
              src={event.photo || PHOTO_PLACEHOLDER}
              alt={event.name}
              className='aspect-video w-full object-cover'
            />
          </div>

          <div className='mt-8'>
            {event.category && (
              <Link
                href={buildEventsHref(
                  { categoryId: event.category.id },
                  EVENTS_PAGE_PATH,
                )}
                className='rounded-full bg-accent px-3 py-1.5 text-caption font-bold text-accent-foreground transition hover:bg-accent/70'
              >
                {event.category.name}
              </Link>
            )}
            <h1 className='mt-4 text-h1 text-foreground sm:text-display'>
              {event.name}
            </h1>
            {event.subtitle && (
              <p className='mt-4 max-w-2xl text-lg leading-8 text-muted-foreground'>
                {event.subtitle}
              </p>
            )}
          </div>

          <DetailsSection title='Sobre o evento'>
            <EventDescription markdown={event.description} />
          </DetailsSection>

          <DetailsSection title='Local' icon={MapPin}>
            <EventLocationCard location={event.location} />
          </DetailsSection>

          {event.user && (
            <DetailsSection title='Sobre o produtor'>
              <OrganizerCard name={event.user.name} />
            </DetailsSection>
          )}

          <DetailsSection title='Política do evento'>
            <EventPolicy />
          </DetailsSection>
        </div>

        <EventPurchaseCard
          event={event}
          paymentMethods={paymentMethods}
          unavailableReason={getUnavailableReason(event)}
        />
      </div>
    </main>
  );
}
