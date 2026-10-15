// Valores monetários são sempre inteiros em centavos
export const MAX_TICKETS_PER_ORDER = 10;

export type OrderStatus = 'awaiting_payment' | 'paid' | 'expired' | 'cancelled' | 'refunded';

export type TicketStatus = 'valid' | 'used' | 'cancelled';

export type ChargeMethod = 'card' | 'pix';

export type ChargeStatus =
  | 'pending'
  | 'authorized'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

export interface OrderTicket {
  id: number;
  code: string;
  status: TicketStatus;
  used_at: string | null;
}

export interface OrderItem {
  id: string;
  lot_id: number;
  quantity: number;
  unit_price_cents: number;
  tickets: OrderTicket[];
}

export interface Charge {
  id: string;
  method: ChargeMethod;
  status: ChargeStatus;
  amount_cents: number;
  currency: string;
  // Código copia e cola do Pix
  pix_qr_code: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  buyer_id: number;
  event_id: number;
  status: OrderStatus;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  currency: string;
  // Fim da reserva: depois disso o pedido expira e os ingressos voltam ao estoque
  expires_at: string;
  paid_at: string | null;
  created_at: string;
  items: OrderItem[];
  charges?: Charge[];
}

export interface CreateOrderInput {
  items: { lotId: number; quantity: number }[];
}

export interface PayOrderInput {
  method: ChargeMethod;
  // Token do cartão gerado pelo provedor no navegador; o número do cartão nunca passa pela API
  paymentToken?: string;
}
