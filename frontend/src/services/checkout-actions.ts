'use server';

import { revalidatePath } from 'next/cache';
import type {
  Charge,
  Order,
  OrderStatus,
  PayOrderInput,
} from '@golden-events/shared';
import { buildEventHref } from '@/utils/events_href';
import {
  fetchWithAuth,
  sendWithAuth,
  sendWithAuthForData,
  type ActionResult,
} from './authenticated-api';

type CreateOrderInput = {
  slug: string;
  lotId: number;
  quantity: number;
};

export async function createOrder({ slug, lotId, quantity }: CreateOrderInput) {
  const result = await sendWithAuthForData<Order>(
    '/orders',
    'POST',
    { items: [{ lotId, quantity }] },
    'Pedido criado.',
  );

  // A quantidade de ingressos disponíveis mudou. Revalidar re-renderiza o checkout, que segura
  // a página pela reserva; o pedido gratuito já sai pago e, se esgotasse o lote, iria para o evento
  if (result.success && result.data.status === 'awaiting_payment') {
    revalidatePath(buildEventHref(slug));
  }

  return result;
}

export async function payOrder(orderId: string, input: PayOrderInput) {
  return sendWithAuthForData<Charge>(
    `/orders/${encodeURIComponent(orderId)}/pay`,
    'POST',
    input,
    'Pagamento enviado.',
  );
}

export async function cancelOrder(
  orderId: string,
  slug: string,
): Promise<ActionResult> {
  const result = await sendWithAuth(
    `/orders/${encodeURIComponent(orderId)}/cancel`,
    'POST',
    undefined,
    'Pedido cancelado.',
  );

  if (result.success) {
    revalidatePath(buildEventHref(slug));
  }

  return result;
}

// null quando a API não responde: quem acompanha o pedido tenta de novo depois
export async function getOrderStatus(
  orderId: string,
): Promise<OrderStatus | null> {
  try {
    const order = await fetchWithAuth<Order>(
      `/orders/${encodeURIComponent(orderId)}`,
    );

    return order.status;
  } catch {
    return null;
  }
}

// Faz o papel do banco do comprador no provedor fake, que não tem um app para pagar o Pix
export async function simulatePixPayment(
  chargeId: string,
): Promise<ActionResult> {
  if (process.env.FAKE_GATEWAY_SIMULATOR !== 'on') {
    return { success: false, message: 'Simulador de pagamento desativado.' };
  }

  return sendWithAuth(
    `/fake-gateway/charges/${encodeURIComponent(chargeId)}/pay`,
    'POST',
    undefined,
    'Pagamento do Pix simulado.',
  );
}
