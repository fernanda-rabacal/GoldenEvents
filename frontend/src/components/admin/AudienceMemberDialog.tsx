'use client';

import { useEffect, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import type {
  OrganizerAudienceMember,
  OrganizerOrder,
} from '@golden-events/shared';
import { fetchAudienceMemberOrders } from '@/services/audience-actions';
import { buttonVariants } from '@/ui/button';
import { Skeleton } from '@/ui/skeleton';
import { formatCheckIns } from '@/utils/audience';
import { formatShortDateTime } from '@/utils/format_date';
import { formatMoney } from '@/utils/format_money';
import {
  TICKET_STATUS_LABEL,
  formatOrderCode,
  formatTicketCount,
} from '@/utils/orders';
import { formatTicketCode } from '@/utils/tickets';

type AudienceMemberDialogProps = {
  // Continua preenchido enquanto o painel fecha, para a animação não esvaziar o conteúdo
  member: OrganizerAudienceMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AudienceMemberDialog({
  member,
  open,
  onOpenChange,
}: AudienceMemberDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className='fixed inset-0 z-50 min-h-dvh bg-foreground/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0' />
        <Dialog.Popup className='fixed inset-y-0 right-0 z-50 flex w-lg max-w-full flex-col bg-card shadow-xl transition-transform duration-200 data-ending-style:translate-x-full data-starting-style:translate-x-full'>
          {member && <MemberDetails member={member} />}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type History = {
  buyerId: number;
  orders: OrganizerOrder[] | null;
  error: string | null;
};

function MemberDetails({ member }: { member: OrganizerAudienceMember }) {
  const buyerId = member.buyer.id;
  const [history, setHistory] = useState<History | null>(null);

  useEffect(() => {
    let active = true;

    fetchAudienceMemberOrders(buyerId).then((result) => {
      if (active) {
        setHistory({
          buyerId,
          orders: result.success ? result.data : null,
          error: result.success ? null : result.message,
        });
      }
    });

    return () => {
      active = false;
    };
  }, [buyerId]);

  const current = history?.buyerId === buyerId ? history : null;

  return (
    <>
      <div className='flex items-start justify-between gap-4 border-b border-border px-6 py-5'>
        <div>
          <p className='text-caption font-bold tracking-eyebrow text-secondary uppercase'>
            {member.events_count > 1 ? 'Público recorrente' : 'Público'}
          </p>
          <Dialog.Title className='mt-2 text-h4 text-foreground'>
            {member.buyer.name}
          </Dialog.Title>
          <Dialog.Description className='mt-1 text-body-sm text-muted-foreground'>
            {member.buyer.email}
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
          <Detail label='Total gasto'>{formatMoney(member.total_cents)}</Detail>
          <Detail label='Eventos'>{member.events_count}</Detail>
          <Detail label='Ingressos'>
            {formatTicketCount(member.tickets_count)}
          </Detail>
          <Detail label='Check-in'>{formatCheckIns(member)}</Detail>
          <Detail label='Primeira compra'>
            {formatShortDateTime(member.first_purchase_at)}
          </Detail>
          <Detail label='Última compra'>
            {formatShortDateTime(member.last_purchase_at)}
          </Detail>
        </dl>

        <section>
          <h3 className='text-body font-bold text-foreground'>
            Histórico de compras
          </h3>
          {!current && (
            <div className='mt-3 flex flex-col gap-3'>
              <Skeleton className='h-24 rounded-xl' />
              <Skeleton className='h-24 rounded-xl' />
            </div>
          )}
          {current?.error && (
            <p className='mt-3 text-body-sm text-destructive'>
              {current.error}
            </p>
          )}
          {current?.orders && (
            <ul className='mt-3 flex flex-col gap-3'>
              {current.orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function OrderCard({ order }: { order: OrganizerOrder }) {
  const tickets = order.items.flatMap((item) =>
    item.tickets.map((ticket) => ({ ...ticket, item })),
  );

  return (
    <li className='rounded-xl border border-border'>
      <div className='flex items-start justify-between gap-4 border-b border-border px-4 py-3 text-body-sm'>
        <div>
          <p className='font-bold text-foreground'>{order.event.name}</p>
          <p className='text-caption text-muted-foreground'>
            {formatOrderCode(order.id)} ·{' '}
            {formatShortDateTime(order.paid_at ?? order.created_at)}
          </p>
        </div>
        <p className='font-black whitespace-nowrap text-foreground'>
          {formatMoney(order.total_cents)}
        </p>
      </div>
      <ul className='divide-y divide-border'>
        {tickets.map((ticket) => (
          <li
            key={ticket.id}
            className='flex items-center justify-between gap-4 px-4 py-2.5 text-caption'
          >
            <div>
              <p className='font-bold text-foreground'>
                {formatTicketCode(ticket.id)}
              </p>
              <p className='text-muted-foreground'>
                {ticket.item.sector_name} · {ticket.item.lot_name}
              </p>
            </div>
            <p className='text-right text-muted-foreground'>
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
    </li>
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
