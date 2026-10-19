'use client';

import { Download } from 'lucide-react';
import type { OrganizerOrder } from '@golden-events/shared';
import { Button } from '@/ui/button';
import { downloadCsv } from '@/utils/csv';
import { formatShortDateTime } from '@/utils/format_date';
import { formatMoney } from '@/utils/format_money';
import {
  ORDER_STATUS,
  formatOrderCode,
  formatPaymentMethod,
} from '@/utils/orders';

type ExportOrdersButtonProps = {
  orders: OrganizerOrder[];
};

export function ExportOrdersButton({ orders }: ExportOrdersButtonProps) {
  function handleExport() {
    downloadCsv(
      'vendas.csv',
      [
        'Pedido',
        'Comprador',
        'E-mail',
        'Evento',
        'Ingressos',
        'Pagamento',
        'Status',
        'Data',
        'Total',
        'Taxa',
        'Líquido',
      ],
      orders.map((order) => [
        formatOrderCode(order.id),
        order.buyer.name,
        order.buyer.email,
        order.event.name,
        order.ticket_count,
        formatPaymentMethod(order),
        ORDER_STATUS[order.status].label,
        formatShortDateTime(order.created_at),
        formatMoney(order.total_cents),
        formatMoney(order.platform_fee_cents),
        formatMoney(order.total_cents - order.platform_fee_cents),
      ]),
    );
  }

  return (
    <Button
      variant='outline'
      disabled={orders.length === 0}
      onClick={handleExport}
    >
      <Download data-icon='inline-start' /> Exportar CSV
    </Button>
  );
}
