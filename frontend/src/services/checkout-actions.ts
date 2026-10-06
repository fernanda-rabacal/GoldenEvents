'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { buildEventHref } from '@/utils/events_href';
import { API_URL } from './api';
import { AUTH_COOKIE } from './auth';

type BuyTicketsInput = {
  eventId: number;
  slug: string;
  quantity: number;
  paymentMethodId: number;
};

export type BuyTicketsResult = {
  success: boolean;
  message: string;
};

export async function buyTickets({
  eventId,
  slug,
  quantity,
  paymentMethodId,
}: BuyTicketsInput): Promise<BuyTicketsResult> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;

  if (!token) {
    return {
      success: false,
      message: 'Sua sessão expirou. Entre novamente para comprar.',
    };
  }

  try {
    const response = await fetch(`${API_URL}/events/${eventId}/buy-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ eventId, quantity, paymentMethodId }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = Array.isArray(data.message)
        ? data.message.join(' ')
        : data.message;

      return {
        success: false,
        message: message ?? 'Não foi possível concluir a compra.',
      };
    }

    // A quantidade de ingressos disponíveis mudou
    revalidatePath(buildEventHref(slug));

    return {
      success: true,
      message: data.message ?? 'Compra realizada com sucesso!',
    };
  } catch {
    return {
      success: false,
      message: 'Não foi possível concluir a compra. Tente novamente.',
    };
  }
}
