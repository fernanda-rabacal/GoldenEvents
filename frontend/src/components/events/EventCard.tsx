import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import type { Event } from '@golden-events/shared';
import { formatDayMonth } from '@/utils/format_date';
import { formatTicketPrice } from '@/utils/format_money';

type EventCardProps = {
  event: Event;
};

export function EventCard({ event }: EventCardProps) {
  return (
    <article className='group overflow-hidden rounded-xl border border-border bg-white transition hover:-translate-y-1 hover:shadow-xl'>
      <div className='relative h-52 overflow-hidden'>
        <img
          src={event.photo}
          alt={event.name}
          className='size-full object-cover transition duration-500 group-hover:scale-105'
        />
        {event.category && (
          <span className='absolute top-4 left-4 rounded-full bg-card px-3 py-1 text-caption font-bold text-primary'>
            {event.category.name}
          </span>
        )}
        <span className='absolute right-4 bottom-4 rounded-xl bg-background px-3 py-2 text-center text-caption font-black text-primary'>
          {formatDayMonth(event.start_date)}
        </span>
      </div>

      <div className='p-5'>
        <h3 className='text-h4 text-foreground'>{event.name}</h3>
        <p className='mt-2 flex items-center gap-1.5 text-body-sm text-muted-foreground'>
          <MapPin className='size-4 text-orange-500' /> {event.location}
        </p>
        <div className='mt-5 flex items-center justify-between gap-3'>
          <p className='text-body-sm font-bold text-foreground'>
            {formatTicketPrice(event.min_price)}
          </p>
          <Link
            href={`/eventos/${event.slug}`}
            className='flex items-center gap-2 text-body-sm font-bold text-accent-foreground'
          >
            Ver detalhes{' '}
            <ArrowRight className='size-4 transition group-hover:translate-x-1' />
          </Link>
        </div>
      </div>
    </article>
  );
}
