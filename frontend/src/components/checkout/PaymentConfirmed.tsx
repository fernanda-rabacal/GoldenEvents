import Link from 'next/link';
import { Check } from 'lucide-react';
import { MY_TICKETS_PATH } from '@/components/layout/nav-links';

type PaymentConfirmedProps = {
  eventName: string;
  isFree: boolean;
};

export function PaymentConfirmed({ eventName, isFree }: PaymentConfirmedProps) {
  return (
    <main className='flex min-h-screen items-center justify-center bg-background px-5 text-foreground'>
      <div className='w-full max-w-md rounded-[2rem] bg-card p-8 text-center shadow-xl'>
        <div className='mx-auto flex size-16 items-center justify-center rounded-full bg-green-50 text-green-600'>
          <Check className='size-8' />
        </div>
        <h1 className='mt-6 text-3xl font-black'>
          {isFree ? 'Pedido confirmado' : 'Pagamento confirmado'}
        </h1>
        <p className='mt-3 leading-7 text-muted-foreground'>
          Seu ingresso para o {eventName} está garantido. Enviamos os detalhes
          para o seu e-mail.
        </p>
        <Link
          href={MY_TICKETS_PATH}
          className='mt-7 inline-flex rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground'
        >
          Acessar meus ingressos
        </Link>
      </div>
    </main>
  );
}
