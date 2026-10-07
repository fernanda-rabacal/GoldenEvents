'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';
import { formatShortDateTime } from '@/utils/format_date';
import { formatMoney } from '@/utils/format_money';
import { getInitials } from '@/utils/user_profile';

type OrderStatus = 'approved' | 'pending' | 'canceled';

type Order = {
  id: number;
  buyer: { name: string; email: string };
  event: string;
  purchasedAt: string;
  quantity: number;
  status: OrderStatus;
  total: number;
};

// Dados de exemplo até a API expor os pedidos dos eventos do organizador
const MOCK_ORDERS: Order[] = [
  {
    id: 1,
    buyer: { name: 'Mariana Oliveira', email: 'mariana@email.com' },
    event: 'Festival de Verão',
    purchasedAt: '2026-10-06T14:32:00',
    quantity: 2,
    status: 'approved',
    total: 90,
  },
  {
    id: 2,
    buyer: { name: 'Carlos Eduardo', email: 'carlos@email.com' },
    event: 'Design & Coffee',
    purchasedAt: '2026-10-06T11:08:00',
    quantity: 1,
    status: 'approved',
    total: 35,
  },
  {
    id: 3,
    buyer: { name: 'Juliana Santos', email: 'juliana@email.com' },
    event: 'Festival de Verão',
    purchasedAt: '2026-10-05T18:46:00',
    quantity: 3,
    status: 'approved',
    total: 135,
  },
  {
    id: 4,
    buyer: { name: 'Rafael Lima', email: 'rafael@email.com' },
    event: 'Festival de Verão',
    purchasedAt: '2026-10-05T09:21:00',
    quantity: 1,
    status: 'pending',
    total: 45,
  },
  {
    id: 5,
    buyer: { name: 'Beatriz Costa', email: 'beatriz@email.com' },
    event: 'Design & Coffee',
    purchasedAt: '2026-10-04T16:15:00',
    quantity: 2,
    status: 'canceled',
    total: 70,
  },
];

const ALL_EVENTS = '';

const STATUS = {
  approved: { label: 'Aprovada', className: 'bg-green-50 text-green-600' },
  pending: { label: 'Pendente', className: 'bg-accent text-orange-800' },
  canceled: { label: 'Cancelada', className: 'bg-red-50 text-red-500' },
} satisfies Record<OrderStatus, { label: string; className: string }>;

function formatQuantity(quantity: number) {
  return `${quantity} ${quantity === 1 ? 'ingresso' : 'ingressos'}`;
}

function toCsvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function downloadCsv(orders: Order[]) {
  const header = [
    'Comprador',
    'E-mail',
    'Evento',
    'Data da compra',
    'Quantidade',
    'Status',
    'Total',
  ];
  const rows = orders.map((order) => [
    order.buyer.name,
    order.buyer.email,
    order.event,
    formatShortDateTime(order.purchasedAt),
    order.quantity,
    STATUS[order.status].label,
    formatMoney(order.total),
  ]);
  // Ponto e vírgula e BOM para o Excel em português abrir com as colunas e acentos certos
  const csv = [header, ...rows]
    .map((row) => row.map(toCsvCell).join(';'))
    .join('\n');
  const url = URL.createObjectURL(
    new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }),
  );
  const link = document.createElement('a');

  link.href = url;
  link.download = 'historico-de-compras.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export function OrdersHistory() {
  const [selectedEvent, setSelectedEvent] = useState(ALL_EVENTS);
  const events = [...new Set(MOCK_ORDERS.map(({ event }) => event))];
  const orders = selectedEvent
    ? MOCK_ORDERS.filter(({ event }) => event === selectedEvent)
    : MOCK_ORDERS;
  const approvedOrders = orders.filter(({ status }) => status === 'approved');

  const summary = [
    {
      label: 'Vendas no período',
      value: formatMoney(
        approvedOrders.reduce((sum, { total }) => sum + total, 0),
      ),
    },
    { label: 'Pedidos aprovados', value: String(approvedOrders.length) },
    {
      label: 'Ingressos vendidos',
      value: String(
        approvedOrders.reduce((sum, { quantity }) => sum + quantity, 0),
      ),
    },
  ];

  return (
    <section className='rounded-xl border border-border bg-card p-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <p className='text-caption font-bold tracking-eyebrow text-secondary uppercase'>
            Financeiro
          </p>
          <h2 className='mt-2 text-h4 text-foreground'>Histórico de compras</h2>
          <p className='mt-1 text-body-sm text-muted-foreground'>
            Acompanhe os pedidos e pagamentos dos seus eventos.
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          <label className='relative'>
            <span className='sr-only'>Filtrar por evento</span>
            <select
              value={selectedEvent}
              onChange={(event) => setSelectedEvent(event.target.value)}
              className='h-10 appearance-none rounded-xl border border-border bg-background py-0 pr-9 pl-3 text-body-sm font-bold text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
            >
              <option value={ALL_EVENTS}>Todos os eventos</option>
              {events.map((event) => (
                <option key={event} value={event}>
                  {event}
                </option>
              ))}
            </select>
            <ChevronDown className='pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground' />
          </label>
          <Button
            size='lg'
            className='h-10 rounded-xl px-4 font-bold'
            onClick={() => downloadCsv(orders)}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      <dl className='mt-6 grid gap-3 sm:grid-cols-3'>
        {summary.map(({ label, value }) => (
          <div key={label} className='rounded-xl bg-background px-4 py-4'>
            <dt className='text-caption font-bold tracking-wide text-muted-foreground uppercase'>
              {label}
            </dt>
            <dd className='mt-2 text-h3 text-foreground'>{value}</dd>
          </div>
        ))}
      </dl>

      <div className='mt-6 overflow-x-auto'>
        <table className='w-full min-w-3xl text-left text-body-sm'>
          <thead className='border-b border-border text-caption font-bold tracking-wide text-muted-foreground uppercase'>
            <tr>
              <th className='py-3 pr-4 font-bold'>Comprador</th>
              <th className='px-4 py-3 font-bold'>Evento</th>
              <th className='px-4 py-3 font-bold'>Data da compra</th>
              <th className='px-4 py-3 font-bold'>Quantidade</th>
              <th className='px-4 py-3 font-bold'>Status</th>
              <th className='py-3 pl-4 text-right font-bold'>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className='border-b border-border last:border-0'
              >
                <td className='py-4 pr-4'>
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
                <td className='px-4 py-4 font-bold text-foreground'>
                  {order.event}
                </td>
                <td className='px-4 py-4 whitespace-nowrap text-muted-foreground'>
                  {formatShortDateTime(order.purchasedAt)}
                </td>
                <td className='px-4 py-4 whitespace-nowrap text-muted-foreground'>
                  {formatQuantity(order.quantity)}
                </td>
                <td className='px-4 py-4'>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-caption font-bold',
                      STATUS[order.status].className,
                    )}
                  >
                    {STATUS[order.status].label}
                  </span>
                </td>
                <td className='py-4 pl-4 text-right font-black whitespace-nowrap text-foreground'>
                  {formatMoney(order.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
