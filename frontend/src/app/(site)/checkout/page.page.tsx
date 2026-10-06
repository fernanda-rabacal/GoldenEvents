import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { requireUser } from '@/services/auth';
import { getEventBySlug, getPaymentMethods } from '@/services/events';
import {
  getMaxTicketQuantity,
  getUnavailableReason,
} from '@/utils/event_availability';
import {
  EVENTS_PAGE_PATH,
  buildCheckoutHref,
  buildEventHref,
} from '@/utils/events_href';
import {
  firstValue,
  type SearchParamValue,
} from '@/utils/events_search_params';

export const metadata: Metadata = {
  title: 'Finalizar compra',
};

type CheckoutPageProps = {
  searchParams: Promise<{
    evento?: SearchParamValue;
    quantidade?: SearchParamValue;
  }>;
};

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const params = await searchParams;
  const slug = firstValue(params.evento);
  const requestedQuantity = Math.trunc(
    Number(firstValue(params.quantidade)) || 1,
  );

  if (!slug) {
    redirect(EVENTS_PAGE_PATH);
  }

  await requireUser(buildCheckoutHref(slug, requestedQuantity));

  // Sem cache: preço e ingressos disponíveis precisam estar atualizados na compra
  const [event, paymentMethods] = await Promise.all([
    getEventBySlug(slug, { cache: 'no-store' }),
    getPaymentMethods(),
  ]);

  if (!event) {
    notFound();
  }

  if (getUnavailableReason(event)) {
    redirect(buildEventHref(event.slug));
  }

  const maxQuantity = getMaxTicketQuantity(event);
  const quantity = Math.min(Math.max(1, requestedQuantity), maxQuantity);

  return (
    <main className='mx-auto max-w-6xl px-5 py-8 lg:px-8'>
      <Link
        href={buildEventHref(event.slug)}
        className='inline-flex items-center gap-2 text-body-sm font-bold text-muted-foreground transition hover:text-accent-foreground'
      >
        <ArrowLeft className='size-4' /> Voltar para o evento
      </Link>

      <div className='mt-7'>
        <p className='text-body-sm font-bold tracking-eyebrow text-orange-500 uppercase'>
          Checkout
        </p>
        <h1 className='mt-2 text-h2 text-foreground sm:text-h1'>
          Finalizar compra
        </h1>
      </div>

      <CheckoutForm
        event={event}
        paymentMethods={paymentMethods}
        initialQuantity={quantity}
        maxQuantity={maxQuantity}
      />
    </main>
  );
}
