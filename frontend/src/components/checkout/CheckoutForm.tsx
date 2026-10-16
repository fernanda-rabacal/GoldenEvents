'use client';

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import type {
  Charge,
  ChargeMethod,
  Event,
  Lot,
  Order,
  OrderStatus,
  PayOrderInput,
  PaymentMethod,
  Sector,
} from '@golden-events/shared';
import { createCardToken } from '@/lib/card-token';
import { getStripe } from '@/lib/stripe';
import { toastNotify } from '@/lib/toastify';
import {
  cancelOrder,
  createOrder,
  getOrderStatus,
  payOrder,
  simulatePixPayment,
} from '@/services/checkout-actions';
import { buildCheckoutHref, buildEventHref } from '@/utils/events_href';
import { CardPaymentForm, readCardData } from './CardPaymentForm';
import { OrderSummary } from './OrderSummary';
import { PaymentConfirmed } from './PaymentConfirmed';
import { PaymentMethodPicker } from './PaymentMethodPicker';
import { getPaymentOptions } from './payment-options';
import { PixChargePanel } from './PixChargePanel';
import { PixPaymentForm } from './PixPaymentForm';
import { ReservationTimer } from './ReservationTimer';
import { StripeCardForm, type StripeCardHandle } from './StripeCardForm';

const POLL_INTERVAL_MS = 2000;

const RESERVATION_EXPIRED =
  'O prazo para pagar acabou e os ingressos voltaram à venda. Faça um novo pedido.';

const ORDER_CANCELLED = 'Este pedido foi cancelado. Faça um novo pedido.';

// A confirmação chega pelo webhook do provedor: o Pix e o cartão aprovado esperam o pedido virar pago
type Step =
  | { name: 'payment' }
  | { name: 'pix'; charge: Charge }
  | { name: 'confirming' }
  | { name: 'paid' };

type CheckoutFormProps = {
  event: Event;
  sector: Sector;
  lot: Lot;
  paymentMethods: PaymentMethod[];
  initialQuantity: number;
  maxQuantity: number;
  openOrder?: Order;
  canSimulatePix: boolean;
  // Sem a chave, o cartão usa o formulário do provedor fake
  stripePublishableKey?: string;
  children: ReactNode;
};

export function CheckoutForm({
  event,
  sector,
  lot,
  paymentMethods,
  initialQuantity,
  maxQuantity,
  openOrder,
  canSimulatePix,
  stripePublishableKey,
  children,
}: CheckoutFormProps) {
  const router = useRouter();
  const stripeCard = useRef<StripeCardHandle>(null);
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(initialQuantity);
  const [order, setOrder] = useState(openOrder ?? null);
  const [resumedOrderId] = useState(openOrder?.id);
  const [step, setStep] = useState<Step>({ name: 'payment' });
  const paymentOptions = getPaymentOptions(paymentMethods);
  const [paymentMethodId, setPaymentMethodId] = useState(
    () =>
      (
        paymentOptions.find(({ method }) => method === 'card') ??
        paymentOptions[0]
      )?.id,
  );

  // Com o pedido criado, vale o preço que a API reservou
  const total = order?.total_cents ?? lot.price * quantity;
  const isFree = total === 0;
  const selectedMethod = paymentOptions.find(
    ({ id }) => id === paymentMethodId,
  )?.method;
  const orderId = order?.id;
  const isWaitingConfirmation =
    step.name === 'pix' || step.name === 'confirming';

  function discardOrder(message: string) {
    setOrder(null);
    setStep({ name: 'payment' });
    toastNotify('error', message);
    router.refresh();
  }

  function handleOrderClosed(status: OrderStatus) {
    if (status === 'paid') {
      setStep({ name: 'paid' });
    } else {
      discardOrder(
        status === 'expired' ? RESERVATION_EXPIRED : ORDER_CANCELLED,
      );
    }
  }

  const onPolledOrderClosed = useEffectEvent(handleOrderClosed);

  useEffect(() => {
    if (!orderId || !isWaitingConfirmation) {
      return;
    }

    let active = true;
    let timeout: ReturnType<typeof setTimeout>;

    async function poll() {
      const status = await getOrderStatus(orderId!);

      if (!active) {
        return;
      }

      if (status && status !== 'awaiting_payment') {
        onPolledOrderClosed(status);
        return;
      }

      timeout = setTimeout(poll, POLL_INTERVAL_MS);
    }

    timeout = setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [orderId, isWaitingConfirmation]);

  function handleQuantityChange(value: number) {
    setQuantity(value);
    window.history.replaceState(
      null,
      '',
      buildCheckoutHref(event.slug, lot.id, value),
    );
  }

  function handleReservationExpired() {
    // Esperando o Pix, quem decide é a API: o pagamento pode ter chegado no último segundo
    if (step.name === 'payment') {
      discardOrder(RESERVATION_EXPIRED);
    }
  }

  async function getPaymentInput(
    form: HTMLFormElement,
    method: ChargeMethod,
  ): Promise<PayOrderInput | null> {
    if (method === 'pix') {
      return { method };
    }

    const card = stripePublishableKey
      ? ((await stripeCard.current?.createToken()) ?? {
          error: 'O formulário de pagamento ainda está carregando.',
        })
      : createCardToken(readCardData(form));

    if ('error' in card) {
      toastNotify('error', card.error);
      return null;
    }

    return { method, paymentToken: card.token };
  }

  // A recusa pode esconder um pedido que já mudou: pago pelo Pix de antes ou vencido
  async function handlePaymentError(failedOrderId: string, message: string) {
    const status = await getOrderStatus(failedOrderId);

    if (status && status !== 'awaiting_payment') {
      handleOrderClosed(status);
      return;
    }

    toastNotify('error', message);
  }

  // 3D Secure: o banco do comprador confirma o cartão numa janela da Stripe
  async function confirmWithBank(orderId: string, clientSecret: string) {
    const stripe =
      stripePublishableKey && (await getStripe(stripePublishableKey));

    if (!stripe) {
      toastNotify('error', 'Não foi possível abrir a confirmação do banco.');
      return false;
    }

    const { error } = await stripe.handleNextAction({ clientSecret });

    if (error) {
      await handlePaymentError(
        orderId,
        error.message ?? 'O banco não confirmou o pagamento.',
      );
      return false;
    }

    return true;
  }

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();

    const form = formEvent.currentTarget;
    const method = selectedMethod;

    if (!isFree && !method) {
      toastNotify('error', 'Escolha uma forma de pagamento.');
      return;
    }

    startTransition(async () => {
      let paymentInput: PayOrderInput | null = null;

      if (!isFree && method) {
        // Antes de qualquer chamada à API: o cartão vira token aqui e só o token sai do navegador
        paymentInput = await getPaymentInput(form, method);

        if (!paymentInput) {
          return;
        }
      }

      let current = order;

      if (!current) {
        const created = await createOrder({
          slug: event.slug,
          lotId: lot.id,
          quantity,
        });

        if (!created.success) {
          toastNotify('error', created.message);
          return;
        }

        current = created.data;
        setOrder(current);
      }

      if (current.status === 'paid') {
        setStep({ name: 'paid' });
        return;
      }

      // O preço mudou entre a página e a reserva: o resumo já mostra o total da API
      if (!paymentInput) {
        toastNotify('error', 'Escolha uma forma de pagamento para concluir.');
        return;
      }

      const charge = await payOrder(current.id, paymentInput);

      if (!charge.success) {
        await handlePaymentError(current.id, charge.message);
        return;
      }

      if (
        charge.data.client_secret &&
        !(await confirmWithBank(current.id, charge.data.client_secret))
      ) {
        return;
      }

      setStep(
        charge.data.method === 'pix' && charge.data.status === 'pending'
          ? { name: 'pix', charge: charge.data }
          : { name: 'confirming' },
      );
    });
  }

  function handleSimulatePixPayment(chargeId: string) {
    startTransition(async () => {
      const result = await simulatePixPayment(chargeId);

      if (!result.success) {
        toastNotify('error', result.message);
      }
    });
  }

  function handleCancelOrder() {
    if (!order) {
      return;
    }

    startTransition(async () => {
      const result = await cancelOrder(order.id, event.slug);

      if (!result.success) {
        toastNotify('error', result.message);
        return;
      }

      toastNotify('success', result.message);
      router.push(buildEventHref(event.slug));
    });
  }

  if (step.name === 'paid') {
    return <PaymentConfirmed eventName={event.name} isFree={isFree} />;
  }

  return (
    <main className='mx-auto max-w-6xl px-5 py-8 lg:px-8'>
      {children}

      <form
        onSubmit={handleSubmit}
        className='mt-8 grid gap-10 lg:grid-cols-[1.35fr_.85fr] lg:items-start'
      >
        <section className='rounded-xl border border-border bg-card p-6'>
          <h2 className='text-h3 text-foreground'>Forma de pagamento</h2>

          {order && order.id === resumedOrderId && step.name === 'payment' && (
            <p className='mt-4 rounded-2xl bg-accent p-4 text-body-sm text-accent-foreground'>
              Você já tem um pedido aguardando pagamento para este evento.
              Conclua o pagamento abaixo ou cancele o pedido para fazer outro.
            </p>
          )}

          {isFree ? (
            <p className='mt-4 text-body text-muted-foreground'>
              Este evento é gratuito: nenhum pagamento é necessário. É só
              confirmar a quantidade de ingressos.
            </p>
          ) : step.name === 'pix' ? (
            <div className='mt-5'>
              <PixChargePanel
                charge={step.charge}
                onChangeMethod={() => setStep({ name: 'payment' })}
                onSimulatePayment={
                  canSimulatePix
                    ? () => handleSimulatePixPayment(step.charge.id)
                    : undefined
                }
              />
            </div>
          ) : step.name === 'confirming' ? (
            <p
              aria-live='polite'
              className='mt-5 flex items-center gap-3 rounded-2xl bg-background p-6 font-bold text-foreground'
            >
              <LoaderCircle className='size-5 animate-spin text-orange-500' />
              Pagamento aprovado. Emitindo seus ingressos...
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
                {selectedMethod === 'card' &&
                  (stripePublishableKey ? (
                    <StripeCardForm
                      ref={stripeCard}
                      publishableKey={stripePublishableKey}
                      amount={total}
                    />
                  ) : (
                    <CardPaymentForm />
                  ))}
                {selectedMethod === 'pix' && <PixPaymentForm />}
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
          total={total}
          hasOrder={Boolean(order)}
          reservation={
            order && (
              <ReservationTimer
                expiresAt={order.expires_at}
                onExpire={handleReservationExpired}
              />
            )
          }
          isSubmitting={isPending || step.name === 'confirming'}
          canSubmit={step.name === 'payment'}
          onCancelOrder={handleCancelOrder}
        />
      </form>
    </main>
  );
}
