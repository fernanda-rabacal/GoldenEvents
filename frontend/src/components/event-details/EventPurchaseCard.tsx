import { CalendarDays, Clock3, MapPin, Ticket } from 'lucide-react';
import type { Event, PaymentMethod } from '@golden-events/shared';
import {
  formatDuration,
  formatLongDate,
  formatTime,
} from '@/utils/format_date';
import { formatTicketPrice } from '@/utils/format_money';
import { splitLocation } from '@/utils/location';
import { BuyTicketForm } from './BuyTicketForm';
import { EventInfoItem } from './EventInfoItem';
import { ShareEventButton } from './ShareEventButton';

type EventPurchaseCardProps = {
  event: Event;
  paymentMethods: PaymentMethod[];
  unavailableReason?: string;
};

export function EventPurchaseCard({
  event,
  paymentMethods,
  unavailableReason,
}: EventPurchaseCardProps) {
  const { place, region } = splitLocation(event.location);
  const isPaid = event.price > 0;

  return (
    <aside className='rounded-xl border border-border bg-card p-6 shadow-xl shadow-primary/5 lg:sticky lg:top-6'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <p className='text-body-sm font-bold tracking-eyebrow text-orange-500 uppercase'>
            Ingressos
          </p>
          <h2 className='mt-2 text-h3 text-foreground'>Garanta seu ingresso</h2>
        </div>
        <ShareEventButton title={event.name} />
      </div>

      <div className='mt-7 flex flex-col gap-5 border-y border-border py-6'>
        <EventInfoItem
          icon={CalendarDays}
          title={formatLongDate(event.start_date)}
          description={`A partir das ${formatTime(event.start_date)}`}
        />
        <EventInfoItem icon={MapPin} title={place} description={region} />
        {event.end_date && (
          <EventInfoItem
            icon={Clock3}
            title='Duração aproximada'
            description={`${formatDuration(event.start_date, event.end_date)} de evento`}
          />
        )}
      </div>

      <div className='mt-6 flex items-end justify-between'>
        <div>
          <p className='text-body-sm text-muted-foreground'>
            Valor do ingresso
          </p>
          <p className='mt-1 text-h3 text-primary'>
            {formatTicketPrice(event.price)}
          </p>
          {!unavailableReason && (
            <p className='mt-1 text-caption text-muted-foreground'>
              {event.quantity_left} disponíveis
            </p>
          )}
        </div>
        <Ticket className='size-7 text-orange-500' />
      </div>

      {isPaid && paymentMethods.length > 0 && (
        <div className='mt-6 rounded-2xl bg-background p-4'>
          <p className='text-body-sm font-black text-foreground'>
            Formas de pagamento
          </p>
          <div className='mt-3 flex flex-wrap gap-2'>
            {paymentMethods.map((method) => (
              <span
                key={method.id}
                className='rounded-full border border-border bg-card px-3 py-1.5 text-caption font-bold text-muted-foreground'
              >
                {method.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <BuyTicketForm event={event} unavailableReason={unavailableReason} />

      <p className='mt-4 text-center text-caption text-muted-foreground'>
        Compra segura. Seus ingressos ficam disponíveis em Meus ingressos.
      </p>
    </aside>
  );
}
