'use client';

import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import type { OrganizerOrder } from '@golden-events/shared';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/ui/button';
import { formatShortDateTime } from '@/utils/format_date';
import { formatMoney } from '@/utils/format_money';
import {
  ORDER_STATUS,
  TICKET_STATUS_LABEL,
  formatOrderCode,
  formatPaymentMethod,
} from '@/utils/orders';
import { formatTicketCode } from '@/utils/tickets';

type OrderDetailsDialogProps = {
  // Continua preenchido enquanto o painel fecha, para a animação não esvaziar o conteúdo
  order: OrganizerOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OrderDetailsDialog({
  order,
  open,
  onOpenChange,
}: OrderDetailsDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className='fixed inset-0 z-50 min-h-dvh bg-foreground/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0' />
        <Dialog.Popup className='fixed inset-y-0 right-0 z-50 flex w-lg max-w-full flex-col bg-card shadow-xl transition-transform duration-200 data-ending-style:translate-x-full data-starting-style:translate-x-full'>
          {order && <OrderDetails order={order} />}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function OrderDetails({ order }: { order: OrganizerOrder }) {
  const status = ORDER_STATUS[order.status];
  const tickets = order.items.flatMap((item) =>
    item.tickets.map((ticket) => ({ ...ticket, item })),
  );

  return (
    <>
      <div className='flex items-start justify-between gap-4 border-b border-border px-6 py-5'>
        <div>
          <p className='text-caption font-bold tracking-eyebrow text-secondary uppercase'>
            Pedido {formatOrderCode(order.id)}
          </p>
          <Dialog.Title className='mt-2 text-h4 text-foreground'>
            {order.buyer.name}
          </Dialog.Title>
          <Dialog.Description className='mt-1 text-body-sm text-muted-foreground'>
            {order.buyer.email}
          </Dialog.Description>
        </div>
        <Dialog.Close
          aria-label='Fechar'
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        >
          <X />
        </Dialog.Close>
      </div>

      <div className='flex flex-col gap-6 overflow-y-auto px-6 py-6'>
        <dl className='grid grid-cols-2 gap-4 text-body-sm'>
          <Detail label='Status'>
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-caption font-bold',
                status.className,
              )}
            >
              {status.label}
            </span>
          </Detail>
          <Detail label='Pagamento'>{formatPaymentMethod(order)}</Detail>
          <Detail label='Evento'>{order.event.name}</Detail>
          <Detail label='Feito em'>
            {formatShortDateTime(order.created_at)}
          </Detail>
          {order.paid_at && (
            <Detail label='Pago em'>
              {formatShortDateTime(order.paid_at)}
            </Detail>
          )}
        </dl>

        <section>
          <h3 className='text-body font-bold text-foreground'>Itens</h3>
          <ul className='mt-3 divide-y divide-border rounded-xl border border-border'>
            {order.items.map((item) => (
              <li
                key={item.lot_id}
                className='flex items-center justify-between gap-4 px-4 py-3 text-body-sm'
              >
                <div>
                  <p className='font-bold text-foreground'>
                    {item.sector_name} · {item.lot_name}
                  </p>
                  <p className='text-caption text-muted-foreground'>
                    {item.quantity} × {formatMoney(item.unit_price_cents)}
                  </p>
                </div>
                <p className='font-bold whitespace-nowrap text-foreground'>
                  {formatMoney(item.quantity * item.unit_price_cents)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <dl className='flex flex-col gap-2 text-body-sm'>
          <Total label='Subtotal' value={order.subtotal_cents} />
          {order.discount_cents > 0 && (
            <Total label='Desconto' value={-order.discount_cents} />
          )}
          <Total label='Total pago pelo comprador' value={order.total_cents} />
          <Total label='Taxa da plataforma' value={-order.platform_fee_cents} />
          <div className='mt-1 flex justify-between border-t border-border pt-3 text-body font-black text-foreground'>
            <dt>Você recebe</dt>
            <dd>{formatMoney(order.total_cents - order.platform_fee_cents)}</dd>
          </div>
        </dl>

        {tickets.length > 0 && (
          <section>
            <h3 className='text-body font-bold text-foreground'>Ingressos</h3>
            <ul className='mt-3 divide-y divide-border rounded-xl border border-border'>
              {tickets.map((ticket) => (
                <li
                  key={ticket.id}
                  className='flex items-center justify-between gap-4 px-4 py-3 text-body-sm'
                >
                  <div>
                    <p className='font-bold text-foreground'>
                      {formatTicketCode(ticket.id)}
                    </p>
                    <p className='text-caption text-muted-foreground'>
                      {ticket.item.sector_name} · {ticket.item.lot_name}
                    </p>
                  </div>
                  <p className='text-right text-caption text-muted-foreground'>
                    {TICKET_STATUS_LABEL[ticket.status]}
                    {ticket.used_at && (
                      <>
                        <br />
                        {formatShortDateTime(ticket.used_at)}
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className='text-caption font-bold tracking-wide text-muted-foreground uppercase'>
        {label}
      </dt>
      <dd className='mt-1.5 text-foreground'>{children}</dd>
    </div>
  );
}

function Total({ label, value }: { label: string; value: number }) {
  return (
    <div className='flex justify-between text-muted-foreground'>
      <dt>{label}</dt>
      <dd>
        {value < 0 ? '− ' : ''}
        {formatMoney(Math.abs(value))}
      </dd>
    </div>
  );
}
