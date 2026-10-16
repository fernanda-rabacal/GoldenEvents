import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { OrganizerOrder } from '@golden-events/shared';
import { TICKET_SALES_PATH } from '@/components/layout/nav-links';
import { buttonVariants } from '@/ui/button';
import { OrdersTable } from './OrdersTable';

type RecentOrdersProps = {
  orders: OrganizerOrder[];
};

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <section className='rounded-xl border border-border bg-card p-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <p className='text-caption font-bold tracking-eyebrow text-secondary uppercase'>
            Financeiro
          </p>
          <h2 className='mt-2 text-h4 text-foreground'>Últimas vendas</h2>
          <p className='mt-1 text-body-sm text-muted-foreground'>
            Os pedidos mais recentes dos seus eventos.
          </p>
        </div>
        <Link
          href={TICKET_SALES_PATH}
          className={buttonVariants({ variant: 'outline' })}
        >
          Ver todas <ArrowRight data-icon='inline-end' />
        </Link>
      </div>

      <div className='mt-6'>
        {orders.length === 0 ? (
          <p className='rounded-xl border border-dashed border-input p-8 text-center text-body-sm text-muted-foreground'>
            Nenhuma venda ainda.
          </p>
        ) : (
          <OrdersTable orders={orders} compact />
        )}
      </div>
    </section>
  );
}
