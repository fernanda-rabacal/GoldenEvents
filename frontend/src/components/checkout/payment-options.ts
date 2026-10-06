import { Barcode, CreditCard, QrCode, type LucideIcon } from 'lucide-react';
import type { PaymentMethod } from '@golden-events/shared';

export type PaymentKind = 'credit' | 'debit' | 'pix' | 'billet';

export type PaymentOption = PaymentMethod & {
  kind: PaymentKind;
  icon: LucideIcon;
};

const PAYMENT_KINDS: { match: string; kind: PaymentKind; icon: LucideIcon }[] =
  [
    { match: 'crédito', kind: 'credit', icon: CreditCard },
    { match: 'débito', kind: 'debit', icon: CreditCard },
    { match: 'pix', kind: 'pix', icon: QrCode },
    { match: 'boleto', kind: 'billet', icon: Barcode },
  ];

// A API devolve só id e nome; o formulário de cada forma de pagamento é escolhido pelo nome
export function getPaymentOptions(paymentMethods: PaymentMethod[]) {
  return paymentMethods.flatMap((method): PaymentOption[] => {
    const name = method.name.toLowerCase();
    const paymentKind = PAYMENT_KINDS.find(({ match }) => name.includes(match));

    return paymentKind
      ? [{ ...method, kind: paymentKind.kind, icon: paymentKind.icon }]
      : [];
  });
}
