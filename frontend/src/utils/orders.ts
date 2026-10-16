import type {
  OrderStatus,
  OrganizerOrder,
  TicketStatus,
} from '@golden-events/shared';

export const ORDER_STATUS = {
  paid: { label: 'Pago', className: 'bg-green-100 text-green-600' },
  awaiting_payment: {
    label: 'Aguardando pagamento',
    className: 'bg-accent text-orange-800',
  },
  expired: { label: 'Expirado', className: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-500' },
  refunded: {
    label: 'Reembolsado',
    className: 'bg-yellow-100 text-yellow-700',
  },
} satisfies Record<OrderStatus, { label: string; className: string }>;

export const TICKET_STATUS_LABEL = {
  valid: 'Válido',
  used: 'Utilizado',
  cancelled: 'Cancelado',
} satisfies Record<TicketStatus, string>;

// "#A1B2C3D4": o começo do uuid basta para o produtor e o comprador se entenderem
export function formatOrderCode(orderId: string) {
  return `#${orderId.slice(0, 8).toUpperCase()}`;
}

export function formatPaymentMethod({
  method,
  status,
  total_cents,
}: Pick<OrganizerOrder, 'method' | 'status' | 'total_cents'>) {
  if (method === 'pix') {
    return 'Pix';
  }

  if (method === 'card') {
    return 'Cartão';
  }

  return status === 'paid' && total_cents === 0 ? 'Gratuito' : '—';
}

export function formatTicketCount(quantity: number) {
  return `${quantity} ${quantity === 1 ? 'ingresso' : 'ingressos'}`;
}
