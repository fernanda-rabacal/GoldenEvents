'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Event, Lot, PaymentMethod, Sector } from '@golden-events/shared';
import { MY_TICKETS_PATH } from '@/components/layout/nav-links';
import { toastNotify } from '@/lib/toastify';
import { buyTickets } from '@/services/checkout-actions';
import { buildCheckoutHref } from '@/utils/events_href';
import { BilletPaymentForm } from './BilletPaymentForm';
import { CardPaymentForm } from './CardPaymentForm';
import { OrderSummary } from './OrderSummary';
import { PaymentMethodPicker } from './PaymentMethodPicker';
import { getPaymentOptions, type PaymentKind } from './payment-options';
import { PixPaymentForm } from './PixPaymentForm';

// Taxa só exibida: a API registra o ingresso pelo preço do lote
const SERVICE_FEE_RATE = 0.1;

type CheckoutFormProps = {
  event: Event;
  sector: Sector;
  lot: Lot;
  paymentMethods: PaymentMethod[];
  initialQuantity: number;
  maxQuantity: number;
};

export function CheckoutForm({
  event,
  sector,
  lot,
  paymentMethods,
  initialQuantity,
  maxQuantity,
}: CheckoutFormProps) {
  const router = useRouter();
  const [isSubmitting, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(initialQuantity);
  const paymentOptions = getPaymentOptions(paymentMethods);
  const [paymentMethodId, setPaymentMethodId] = useState(
    () =>
      (
        paymentOptions.find(({ kind }) => kind === 'credit') ??
        paymentOptions[0]
      )?.id,
  );

  const isFree = lot.price === 0;
  const subtotal = lot.price * quantity;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = subtotal + serviceFee;
  const selectedKind = paymentOptions.find(
    ({ id }) => id === paymentMethodId,
  )?.kind;

  function handleQuantityChange(value: number) {
    setQuantity(value);
    window.history.replaceState(
      null,
      '',
      buildCheckoutHref(event.slug, lot.id, value),
    );
  }

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();

    // A API exige uma forma de pagamento mesmo para eventos gratuitos
    const selectedPaymentMethodId = isFree
      ? paymentMethods[0]?.id
      : paymentMethodId;

    if (!selectedPaymentMethodId) {
      toastNotify('error', 'Nenhuma forma de pagamento disponível.');
      return;
    }

    startTransition(async () => {
      const result = await buyTickets({
        eventId: Number(event.id),
        slug: event.slug,
        lotId: lot.id,
        quantity,
        paymentMethodId: selectedPaymentMethodId,
      });

      if (!result.success) {
        toastNotify('error', result.message);
        return;
      }

      toastNotify('success', result.message);
      router.push(MY_TICKETS_PATH);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='mt-8 grid gap-10 lg:grid-cols-[1.35fr_.85fr] lg:items-start'
    >
      <section className='rounded-xl border border-border bg-card p-6'>
        <h2 className='text-h3 text-foreground'>Forma de pagamento</h2>

        {isFree ? (
          <p className='mt-4 text-body text-muted-foreground'>
            Este evento é gratuito: nenhum pagamento é necessário. É só
            confirmar a quantidade de ingressos.
          </p>
        ) : (
          <>
            <div className='mt-5'>
              <PaymentMethodPicker
                options={paymentOptions}
                value={paymentMethodId}
                onChange={setPaymentMethodId}
              />
            </div>
            <div className='mt-6'>
              <PaymentForm kind={selectedKind} total={total} />
            </div>
          </>
        )}
      </section>

      <OrderSummary
        event={event}
        sector={sector}
        lot={lot}
        quantity={quantity}
        maxQuantity={maxQuantity}
        onQuantityChange={handleQuantityChange}
        subtotal={subtotal}
        serviceFee={serviceFee}
        total={total}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}

function PaymentForm({ kind, total }: { kind?: PaymentKind; total: number }) {
  switch (kind) {
    case 'credit':
      return <CardPaymentForm total={total} withInstallments />;
    case 'debit':
      return <CardPaymentForm total={total} withInstallments={false} />;
    case 'pix':
      return <PixPaymentForm />;
    case 'billet':
      return <BilletPaymentForm />;
    default:
      return null;
  }
}
