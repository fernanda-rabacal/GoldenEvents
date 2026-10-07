import Link from 'next/link';
import { CalendarDays, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EventTickets } from '@/services/users';
import { buildEventHref } from '@/utils/events_href';
import { formatDateWithTime } from '@/utils/format_date';
import { formatTicketCode, hasEventEnded } from '@/utils/tickets';
import { TicketActions } from './TicketActions';

type TicketCardProps = {
  group: EventTickets;
};

export function TicketCard({ group }: TicketCardProps) {
  const { event, quantity, tickets } = group;
  const hasEnded = hasEventEnded(event);
  const details =
    quantity === 1
      ? `Código ${formatTicketCode(tickets[0].id)}`
      : `${quantity} ingressos`;

  return (
    <article className='flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:flex-row'>
      <Link
        href={buildEventHref(event.slug)}
        className='h-40 shrink-0 sm:h-auto sm:w-44'
      >
        <img
          src={event.photo}
          alt={event.name}
          className={cn('size-full object-cover', hasEnded && 'grayscale-50')}
        />
      </Link>

      <div className='flex min-w-0 flex-1 flex-col gap-2 px-5 py-5'>
        <span
          className={cn(
            'w-fit rounded-full px-2.5 py-1 text-caption font-bold',
            hasEnded
              ? 'bg-muted text-muted-foreground'
              : 'bg-green-50 text-green-600',
          )}
        >
          {hasEnded ? 'Evento encerrado' : 'Próximo evento'}
        </span>
        <h2 className='text-h4 text-foreground'>
          <Link
            href={buildEventHref(event.slug)}
            className='transition hover:text-accent-foreground'
          >
            {event.name}
          </Link>
        </h2>
        <p className='flex items-center gap-2 text-body-sm text-muted-foreground'>
          <CalendarDays className='size-4 shrink-0 text-orange-500' />
          {formatDateWithTime(event.start_date)}
        </p>
        <p className='flex items-center gap-2 text-body-sm text-muted-foreground'>
          <MapPin className='size-4 shrink-0 text-orange-500' />
          <span className='truncate'>{event.location}</span>
        </p>
        <p className='mt-2 text-caption font-bold tracking-wide text-muted-foreground uppercase'>
          {event.category.name} · {details}
        </p>
      </div>

      <div className='flex items-center justify-end gap-3 border-t border-border px-5 py-4 sm:w-40 sm:flex-col sm:justify-center sm:border-t-0 sm:border-l'>
        <TicketActions group={group} />
      </div>
    </article>
  );
}
