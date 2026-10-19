'use client';

import { useState } from 'react';
import type { OrganizerOrder } from '@golden-events/shared';
import { cn } from '@/lib/utils';
import { formatShortDateTime } from '@/utils/format_date';
import { formatMoney } from '@/utils/format_money';
import {
  ORDER_STATUS,
  formatOrderCode,
  formatPaymentMethod,
  formatTicketCount,
} from '@/utils/orders';
import { getInitials } from '@/utils/user_profile';
import { OrderDetailsDialog } from './OrderDetailsDialog';

type OrdersTableProps = {
  orders: OrganizerOrder[];
  showEvent?: boolean;
  // Sem quantidade e forma de pagamento, que continuam no detalhe do pedido
  compact?: boolean;
};

export function OrdersTable({
  orders,
  showEvent = true,
  compact = false,
}: OrdersTableProps) {
  const [selected, setSelected] = useState<OrganizerOrder | null>(null);
  const [open, setOpen] = useState(false);

  function openOrder(order: OrganizerOrder) {
    setSelected(order);
    setOpen(true);
  }

  return (
    <>
      <div className='overflow-x-auto'>
        <table className='w-full min-w-3xl text-left text-body-sm'>
          <thead className='border-b border-border text-caption font-bold tracking-wide text-muted-foreground uppercase'>
            <tr>
              <th className='py-3 pr-4 font-bold'>Pedido</th>
              <th className='px-4 py-3 font-bold'>Comprador</th>
              {showEvent && <th className='px-4 py-3 font-bold'>Evento</th>}
              {!compact && (
                <>
                  <th className='px-4 py-3 font-bold'>Ingressos</th>
                  <th className='px-4 py-3 font-bold'>Pagamento</th>
                </>
              )}
              <th className='px-4 py-3 font-bold'>Status</th>
              <th className='px-4 py-3 font-bold'>Data</th>
              <th className='py-3 pl-4 text-right font-bold'>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                onClick={() => openOrder(order)}
                className='cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-background'
              >
                <td className='py-4 pr-4'>
                  <button
                    type='button'
                    onClick={(event) => {
                      event.stopPropagation();
                      openOrder(order);
                    }}
                    aria-label={`Ver o pedido ${formatOrderCode(order.id)} de ${order.buyer.name}`}
                    className='rounded font-mono font-bold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50'
                  >
                    {formatOrderCode(order.id)}
                  </button>
                </td>
                <td className='px-4 py-4'>
                  <div className='flex items-center gap-3'>
                    <span
                      aria-hidden
                      className='flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-caption font-black text-accent-foreground'
                    >
                      {getInitials(order.buyer.name)}
                    </span>
                    <div>
                      <p className='font-bold text-foreground'>
                        {order.buyer.name}
                      </p>
                      <p className='text-caption text-muted-foreground'>
                        {order.buyer.email}
                      </p>
                    </div>
                  </div>
                </td>
                {showEvent && (
                  <td className='px-4 py-4 font-bold text-foreground'>
                    {order.event.name}
                  </td>
                )}
                {!compact && (
                  <>
                    <td className='px-4 py-4 whitespace-nowrap text-muted-foreground'>
                      {formatTicketCount(order.ticket_count)}
                    </td>
                    <td className='px-4 py-4 text-muted-foreground'>
                      {formatPaymentMethod(order)}
                    </td>
                  </>
                )}
                <td className='px-4 py-4'>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-caption font-bold whitespace-nowrap',
                      ORDER_STATUS[order.status].className,
                    )}
                  >
                    {ORDER_STATUS[order.status].label}
                  </span>
                </td>
                <td className='px-4 py-4 whitespace-nowrap text-muted-foreground'>
                  {formatShortDateTime(order.created_at)}
                </td>
                <td className='py-4 pl-4 text-right font-black whitespace-nowrap text-foreground'>
                  {formatMoney(order.total_cents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <OrderDetailsDialog order={selected} open={open} onOpenChange={setOpen} />
    </>
  );
}
