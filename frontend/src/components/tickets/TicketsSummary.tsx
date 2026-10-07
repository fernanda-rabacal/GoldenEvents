import { CalendarDays, QrCode, Ticket, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EventTickets } from '@/services/users';
import { formatDayLongMonth } from '@/utils/format_date';
import { hasEventEnded } from '@/utils/tickets';

type TicketsSummaryProps = {
  groups: EventTickets[];
};

type SummaryItem = {
  label: string;
  value: string;
  icon: LucideIcon;
  highlight?: boolean;
};

export function TicketsSummary({ groups }: TicketsSummaryProps) {
  const upcoming = groups
    .filter(({ event }) => !hasEventEnded(event))
    .sort((a, b) => a.event.start_date.localeCompare(b.event.start_date));
  const activeTickets = upcoming.reduce(
    (sum, { quantity }) => sum + quantity,
    0,
  );

  const items: SummaryItem[] = [
    {
      label: 'Ingressos ativos',
      value: String(activeTickets),
      icon: Ticket,
      highlight: true,
    },
    {
      label: 'Próximo evento',
      value: upcoming[0]
        ? formatDayLongMonth(upcoming[0].event.start_date)
        : 'Nenhum agendado',
      icon: CalendarDays,
    },
    { label: 'Check-in digital', value: 'Sempre disponível', icon: QrCode },
  ];

  return (
    <dl className='grid gap-3 sm:grid-cols-3'>
      {items.map(({ label, value, icon: Icon, highlight }) => (
        <div
          key={label}
          className={cn(
            'flex flex-col rounded-xl border px-5 py-5',
            highlight
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-foreground',
          )}
        >
          <dt
            className={cn(
              'flex flex-col gap-6 text-body-sm',
              highlight
                ? 'text-primary-foreground/80'
                : 'text-muted-foreground',
            )}
          >
            <Icon
              className={cn(
                'size-5',
                highlight ? 'text-secondary' : 'text-orange-500',
              )}
            />
            {label}
          </dt>
          <dd
            className={cn(
              'mt-1 font-black',
              highlight ? 'text-h3' : 'text-body',
            )}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
