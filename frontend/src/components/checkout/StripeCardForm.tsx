'use client';

import { useImperativeHandle, type Ref } from 'react';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import type { CardTokenResult } from '@/lib/card-token';
import { getStripe } from '@/lib/stripe';

const LOADING = 'O formulário de pagamento ainda está carregando.';

export type StripeCardHandle = {
  createToken: () => Promise<CardTokenResult>;
};

type StripeCardFormProps = {
  publishableKey: string;
  amount: number;
  ref: Ref<StripeCardHandle>;
};

export function StripeCardForm({
  publishableKey,
  amount,
  ref,
}: StripeCardFormProps) {
  return (
    <Elements
      stripe={getStripe(publishableKey)}
      options={{
        mode: 'payment',
        amount,
        currency: 'brl',
        locale: 'pt-BR',
        appearance: { variables: { borderRadius: '16px' } },
      }}
    >
      <StripePaymentElement ref={ref} />
    </Elements>
  );
}

// Os dados do cartão ficam no iframe da Stripe: só o confirmation token chega à API
function StripePaymentElement({ ref }: { ref: Ref<StripeCardHandle> }) {
  const stripe = useStripe();
  const elements = useElements();

  useImperativeHandle(
    ref,
    () => ({
      async createToken() {
        if (!stripe || !elements) {
          return { error: LOADING };
        }

        const { error: submitError } = await elements.submit();

        if (submitError) {
          return {
            error: submitError.message ?? 'Confira os dados do cartão.',
          };
        }

        const { error, confirmationToken } =
          await stripe.createConfirmationToken({
            elements,
            params: { return_url: window.location.href },
          });

        if (error) {
          return {
            error: error.message ?? 'Não foi possível validar o cartão.',
          };
        }

        return { token: confirmationToken.id };
      },
    }),
    [stripe, elements],
  );

  return <PaymentElement />;
}
