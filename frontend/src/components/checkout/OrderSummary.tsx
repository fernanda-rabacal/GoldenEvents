import Link from 'next/link';
import type { Event } from '@golden-events/shared';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/ui/button';
import { buildEventHref } from '@/utils/events_href';
import { formatLongDate, formatTime } from '@/utils/format_date';
import { formatMoney } from '@/utils/format_money';
import { QuantitySelector } from './QuantitySelector';

type OrderSummaryProps = {
  event: Event;
  quantity: number;
  maxQuantity: number;
  onQuantityChange: (quantity: number) => void;
  subtotal: number;
  serviceFee: number;
  total: number;
  isSubmitting: boolean;
};

export function OrderSummary({
  event,
  quantity,
  maxQuantity,
  onQuantityChange,
  subtotal,
  serviceFee,
  total,
  isSubmitting,
}: OrderSummaryProps) {
  const isFree = event.price === 0;

  return (
    <aside className='rounded-3xl border border-border bg-card p-6 shadow-xl shadow-primary/5 lg:sticky lg:top-6'>
      <p className='text-body-sm font-bold tracking-eyebrow text-orange-500 uppercase'>
        Resumo da compra
      </p>
      <h2 className='mt-2 text-h3 text-foreground'>{event.name}</h2>
      <p className='mt-2 text-body-sm text-muted-foreground'>
        {formatLongDate(event.start_date)} às {formatTime(event.start_date)}
      </p>

      <div className='mt-6 border-y border-border py-5'>
        <QuantitySelector
          value={quantity}
          max={maxQuantity}
          onChange={onQuantityChange}
        />
      </div>

      <dl className='mt-5 flex flex-col gap-2 text-body-sm text-muted-foreground'>
        <div className='flex justify-between'>
          <dt>Ingressos ({quantity}x)</dt>
          <dd>{isFree ? 'Gratuito' : formatMoney(subtotal)}</dd>
        </div>
        {!isFree && (
          <div className='flex justify-between'>
            <dt>Taxa de serviço</dt>
            <dd>{formatMoney(serviceFee)}</dd>
          </div>
        )}
      </dl>

      <div className='mt-5 flex items-center justify-between border-t border-border pt-5'>
        <span className='font-bold text-foreground'>Total</span>
        <span className='text-h3 text-primary'>
          {isFree ? 'Gratuito' : formatMoney(total)}
        </span>
      </div>

      <div className='mt-6 flex flex-col gap-3'>
        <Button type='submit' size='lg' disabled={isSubmitting}>
          {isSubmitting ? 'Processando...' : 'Confirmar compra'}
        </Button>
        <Link
          href={buildEventHref(event.slug)}
          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
        >
          Cancelar
        </Link>
      </div>
    </aside>
  );
}
