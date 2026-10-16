import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { Event, Order } from '@golden-events/shared';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { requireUser } from '@/services/auth';
import { getEventBySlug, getPaymentMethods } from '@/services/events';
import { getMyOrders } from '@/services/orders';
import {
  findLot,
  findOfferOnSale,
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
    lote?: SearchParamValue;
    quantidade?: SearchParamValue;
  }>;
};

// A API aceita um pedido em aberto por evento: o checkout retoma esse pedido em vez de criar outro
function findReservation(event: Event, orders: Order[]) {
  const order = orders.find(
    ({ event_id, status, expires_at }) =>
      event_id === Number(event.id) &&
      status === 'awaiting_payment' &&
      new Date(expires_at) > new Date(),
  );
  const item = order?.items[0];
  const offer = item && findLot(event, item.lot_id);

  if (!order || !item || !offer) {
    return undefined;
  }

  return { order, ...offer, quantity: item.quantity };
}

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const params = await searchParams;
  const slug = firstValue(params.evento);
  const lotId = Number(firstValue(params.lote));
  const requestedQuantity = Math.trunc(
    Number(firstValue(params.quantidade)) || 1,
  );

  if (!slug || !lotId) {
    redirect(EVENTS_PAGE_PATH);
  }

  await requireUser(buildCheckoutHref(slug, lotId, requestedQuantity));

  // Sem cache: lote da vez, preço e ingressos disponíveis precisam estar atualizados na compra
  const [event, paymentMethods, myOrders] = await Promise.all([
    getEventBySlug(slug, { cache: 'no-store' }),
    getPaymentMethods(),
    getMyOrders(),
  ]);

  if (!event) {
    notFound();
  }

  const reservation = findReservation(event, myOrders);
  const offer = reservation ?? findOfferOnSale(event, lotId);

  if (!offer?.lot || (!reservation && getUnavailableReason(event))) {
    redirect(buildEventHref(event.slug));
  }

  const maxQuantity = reservation?.quantity ?? getMaxTicketQuantity(offer.lot);
  const quantity =
    reservation?.quantity ??
    Math.min(Math.max(1, requestedQuantity), maxQuantity);

  return (
    <CheckoutForm
      event={event}
      sector={offer.sector}
      lot={offer.lot}
      paymentMethods={paymentMethods}
      initialQuantity={quantity}
      maxQuantity={maxQuantity}
      openOrder={reservation?.order}
      canSimulatePix={process.env.FAKE_GATEWAY_SIMULATOR === 'on'}
      stripePublishableKey={process.env.STRIPE_PUBLISHABLE_KEY}
    >
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
    </CheckoutForm>
  );
}
