import { CreditCard, QrCode, type LucideIcon } from 'lucide-react';
import type { ChargeMethod, PaymentMethod } from '@golden-events/shared';

export type PaymentOption = PaymentMethod & {
  method: ChargeMethod;
  icon: LucideIcon;
};

// O boleto fica de fora: a API só cobra cartão e Pix
const PAYMENT_KINDS: {
  match: string;
  method: ChargeMethod;
  icon: LucideIcon;
}[] = [
  { match: 'crédito', method: 'card', icon: CreditCard },
  { match: 'débito', method: 'card', icon: CreditCard },
  { match: 'pix', method: 'pix', icon: QrCode },
];

// A API devolve só id e nome; o formulário de cada forma de pagamento é escolhido pelo nome
export function getPaymentOptions(paymentMethods: PaymentMethod[]) {
  return paymentMethods.flatMap((paymentMethod): PaymentOption[] => {
    const name = paymentMethod.name.toLowerCase();
    const paymentKind = PAYMENT_KINDS.find(({ match }) => name.includes(match));

    return paymentKind
      ? [
          {
            ...paymentMethod,
            method: paymentKind.method,
            icon: paymentKind.icon,
          },
        ]
      : [];
  });
}
