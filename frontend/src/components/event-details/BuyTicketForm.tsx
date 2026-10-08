'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import type { Event } from '@golden-events/shared';
import { QuantitySelector } from '@/components/checkout/QuantitySelector';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/ui/button';
import {
  getMaxTicketQuantity,
  getSectorOffers,
  type SectorOffer,
} from '@/utils/event_availability';
import { buildCheckoutHref } from '@/utils/events_href';
import { formatDateTime } from '@/utils/format_date';
import { formatMoney, formatTicketPrice } from '@/utils/format_money';

type BuyTicketFormProps = {
  event: Event;
  unavailableReason?: string;
};

function describeOffer({ lot, status }: SectorOffer) {
  if (status === 'sold_out' || !lot) {
    return 'Esgotado';
  }

  if (status === 'not_started' && lot.sales_start) {
    return `Vendas a partir de ${formatDateTime(lot.sales_start)}`;
  }

  return `${lot.name} · ${lot.quantity_left} disponíveis`;
}

export function BuyTicketForm({
  event,
  unavailableReason,
}: BuyTicketFormProps) {
  const offers = getSectorOffers(event);
  const [lotId, setLotId] = useState(
    () => offers.find(({ status }) => status === 'on_sale')?.lot?.id,
  );
  const [quantity, setQuantity] = useState(1);
  const selectedLot = offers.find(({ lot }) => lot?.id === lotId)?.lot;

  if (unavailableReason || !selectedLot) {
    return (
      <Button size='lg' disabled className='mt-6 w-full'>
        {unavailableReason ?? 'Esgotado'}
      </Button>
    );
  }

  const maxQuantity = getMaxTicketQuantity(selectedLot);

  function handleSelect(id: number) {
    setLotId(id);
    setQuantity(1);
  }

  return (
    <div className='mt-6'>
      <fieldset className='flex flex-col gap-2'>
        <legend className='mb-3 text-body-sm font-black text-foreground'>
          Escolha o setor
        </legend>
        {offers.map((offer) => {
          const { sector, lot, status } = offer;
          const isOnSale = status === 'on_sale' && lot;

          return (
            <label
              key={sector.id}
              className={cn(
                'flex items-center gap-3 rounded-2xl border border-border bg-background p-4 transition',
                isOnSale
                  ? 'cursor-pointer hover:border-ring has-checked:border-primary has-checked:bg-accent'
                  : 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type='radio'
                name='lot'
                value={lot?.id ?? ''}
                checked={Boolean(isOnSale) && lot?.id === lotId}
                disabled={!isOnSale}
                onChange={() => lot && handleSelect(lot.id)}
                className='accent-primary'
              />
              <span className='flex flex-1 flex-col'>
                <span className='font-bold text-foreground'>{sector.name}</span>
                <span className='text-caption text-muted-foreground'>
                  {describeOffer(offer)}
                </span>
              </span>
              {isOnSale && (
                <span className='font-bold text-primary'>
                  {formatTicketPrice(lot.price)}
                </span>
              )}
            </label>
          );
        })}
      </fieldset>

      <div className='mt-5'>
        <QuantitySelector
          value={quantity}
          max={maxQuantity}
          onChange={setQuantity}
        />
      </div>

      {selectedLot.price > 0 && (
        <p className='mt-3 flex justify-between text-body-sm text-muted-foreground'>
          Total
          <strong className='text-foreground'>
            {formatMoney(selectedLot.price * quantity)}
          </strong>
        </p>
      )}

      <Link
        href={buildCheckoutHref(event.slug, selectedLot.id, quantity)}
        className={cn(buttonVariants({ size: 'lg' }), 'mt-6 w-full')}
      >
        <Check data-icon='inline-start' /> Comprar ingresso
      </Link>
    </div>
  );
}
