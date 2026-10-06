'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import type { Event } from '@golden-events/shared';
import { QuantitySelector } from '@/components/checkout/QuantitySelector';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/ui/button';
import { getMaxTicketQuantity } from '@/utils/event_availability';
import { buildCheckoutHref } from '@/utils/events_href';
import { formatMoney } from '@/utils/format_money';

type BuyTicketFormProps = {
  event: Event;
  unavailableReason?: string;
};

export function BuyTicketForm({
  event,
  unavailableReason,
}: BuyTicketFormProps) {
  const [quantity, setQuantity] = useState(1);

  if (unavailableReason) {
    return (
      <Button size='lg' disabled className='mt-6 w-full'>
        {unavailableReason}
      </Button>
    );
  }

  return (
    <div className='mt-6'>
      <QuantitySelector
        value={quantity}
        max={getMaxTicketQuantity(event)}
        onChange={setQuantity}
      />

      {event.price > 0 && (
        <p className='mt-3 flex justify-between text-body-sm text-muted-foreground'>
          Total
          <strong className='text-foreground'>
            {formatMoney(event.price * quantity)}
          </strong>
        </p>
      )}

      <Link
        href={buildCheckoutHref(event.slug, quantity)}
        className={cn(buttonVariants({ size: 'lg' }), 'mt-6 w-full')}
      >
        <Check data-icon='inline-start' /> Comprar ingresso
      </Link>
    </div>
  );
}
