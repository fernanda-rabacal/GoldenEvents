'use server';

import { revalidatePath } from 'next/cache';
import type { SectorInput } from '@golden-events/shared';
import { sendWithAuth } from './authenticated-api';

export type EventPayload = {
  name: string;
  subtitle: string | null;
  location: string;
  categoryId: number;
  description: string;
  startDateTime: string;
  endDateTime?: string;
  sectors: SectorInput[];
};

// Listagens públicas (home, /eventos, detalhes) usam cache de 60s
function revalidateEventPages() {
  revalidatePath('/', 'layout');
}

export async function createEvent(payload: EventPayload) {
  const result = await sendWithAuth(
    '/events',
    'POST',
    payload,
    'Evento criado com sucesso!',
  );

  if (result.success) {
    revalidateEventPages();
  }

  return result;
}

export async function updateEvent(eventId: number, payload: EventPayload) {
  const result = await sendWithAuth(
    `/events/${eventId}`,
    'PATCH',
    payload,
    'Evento atualizado com sucesso!',
  );

  if (result.success) {
    revalidateEventPages();
  }

  return result;
}

export async function deleteEvent(eventId: number) {
  const result = await sendWithAuth(
    `/events/${eventId}`,
    'DELETE',
    undefined,
    'Evento excluído com sucesso!',
  );

  if (result.success) {
    revalidateEventPages();
  }

  return result;
}
