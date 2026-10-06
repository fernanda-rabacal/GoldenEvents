'use server';

import { revalidatePath } from 'next/cache';
import { buildEventHref } from '@/utils/events_href';
import { sendWithAuth, type ActionResult } from './authenticated-api';

type BuyTicketsInput = {
  eventId: number;
  slug: string;
  quantity: number;
  paymentMethodId: number;
};

export async function buyTickets({
  eventId,
  slug,
  quantity,
  paymentMethodId,
}: BuyTicketsInput): Promise<ActionResult> {
  const result = await sendWithAuth(
    `/events/${eventId}/buy-ticket`,
    'POST',
    { eventId, quantity, paymentMethodId },
    'Compra realizada com sucesso!',
  );

  if (result.success) {
    // A quantidade de ingressos disponíveis mudou
    revalidatePath(buildEventHref(slug));
  }

  return result;
}
