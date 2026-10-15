import type { ReactNode } from 'react';
import Link from 'next/link';
import type { Event, Lot, Sector } from '@golden-events/shared';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/ui/button';
import { buildEventHref } from '@/utils/events_href';
import { formatLongDate, formatTime } from '@/utils/format_date';
import { formatMoney } from '@/utils/format_money';
import { QuantitySelector } from './QuantitySelector';

type OrderSummaryProps = {
  event: Event;
  sector: Sector;
  lot: Lot;
  quantity: number;
  maxQuantity: number;
  onQuantityChange: (quantity: number) => void;
  total: number;
  // Com o pedido criado, a quantidade e o preço ficam presos aos da reserva
  hasOrder: boolean;
  reservation?: ReactNode;
  isSubmitting: boolean;
  canSubmit: boolean;
  onCancelOrder: () => void;
};

export function OrderSummary({
  event,
  sector,
  lot,
  quantity,
  maxQuantity,
  onQuantityChange,
  total,
  hasOrder,
  reservation,
  isSubmitting,
  canSubmit,
  onCancelOrder,
}: OrderSummaryProps) {
  const isFree = total === 0;

  return (
    <aside className='rounded-xl border border-border bg-card p-6 shadow-xl shadow-primary/5 lg:sticky lg:top-6'>
      <p className='text-body-sm font-bold tracking-eyebrow text-orange-500 uppercase'>
        Resumo da compra
      </p>
      <h2 className='mt-2 text-h3 text-foreground'>{event.name}</h2>
      <p className='mt-2 text-body-sm text-muted-foreground'>
        {formatLongDate(event.start_date)} às {formatTime(event.start_date)}
      </p>
      <p className='mt-1 text-body-sm font-bold text-foreground'>
        {sector.name} · {lot.name}
      </p>

      {reservation}

      <div className='mt-6 border-y border-border py-5'>
        <QuantitySelector
          value={quantity}
          max={maxQuantity}
          onChange={onQuantityChange}
          disabled={hasOrder}
        />
      </div>

      <dl className='mt-5 flex justify-between text-body-sm text-muted-foreground'>
        <dt>Ingressos ({quantity}x)</dt>
        <dd>{isFree ? 'Gratuito' : formatMoney(total)}</dd>
      </dl>

      <div className='mt-5 flex items-center justify-between border-t border-border pt-5'>
        <span className='font-bold text-foreground'>Total</span>
        <span className='text-h3 text-primary'>
          {isFree ? 'Gratuito' : formatMoney(total)}
        </span>
      </div>

      <div className='mt-6 flex flex-col gap-3'>
        <Button type='submit' size='lg' disabled={isSubmitting || !canSubmit}>
          {isSubmitting ? 'Processando...' : 'Confirmar compra'}
        </Button>
        {hasOrder ? (
          <Button
            type='button'
            variant='outline'
            size='lg'
            disabled={isSubmitting}
            onClick={onCancelOrder}
          >
            Cancelar pedido
          </Button>
        ) : (
          <Link
            href={buildEventHref(event.slug)}
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
          >
            Cancelar
          </Link>
        )}
      </div>
    </aside>
  );
}
