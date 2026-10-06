import Link from 'next/link';
import { CalendarDays, MapPin } from 'lucide-react';
import type { Event } from '@golden-events/shared';
import { formatDay, formatMonthYear } from '@/utils/format_date';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85';

type FeaturedEventCardProps = {
  event?: Event;
};

export function FeaturedEventCard({ event }: FeaturedEventCardProps) {
  return (
    <div className='relative min-h-105 overflow-hidden rounded-4xl bg-primary shadow-2xl shadow-primary/20 lg:min-h-128'>
      <img
        src={event?.photo || FALLBACK_IMAGE}
        alt=''
        className='absolute inset-0 size-full object-cover opacity-80'
      />
      <div className='absolute inset-0 bg-linear-to-t from-red-900 via-primary/40 to-transparent' />

      {event && (
        <div className='absolute top-7 left-7 rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur-sm'>
          <CalendarDays className='mb-2 size-5 text-orange-500' />
          <p className='text-h3 text-foreground'>
            {formatDay(event.start_date)}
          </p>
          <p className='text-caption font-bold tracking-wider text-accent-foreground uppercase'>
            {formatMonthYear(event.start_date)}
          </p>
        </div>
      )}

      <div className='absolute right-7 bottom-8 left-7 text-white'>
        <p className='mb-2 text-caption font-bold tracking-eyebrow text-orange-300 uppercase'>
          {event ? 'Destaque da semana' : 'Em breve'}
        </p>
        {event ? (
          <>
            <h2 className='text-h2'>
              <Link href={`/eventos/${event.slug}`} className='hover:underline'>
                {event.name}
              </Link>
            </h2>
            <p className='mt-2 flex items-center gap-1.5 text-body-sm text-white/80'>
              <MapPin className='size-4' /> {event.location}
            </p>
          </>
        ) : (
          <h2 className='text-h2'>Novos eventos chegando</h2>
        )}
      </div>
    </div>
  );
}
