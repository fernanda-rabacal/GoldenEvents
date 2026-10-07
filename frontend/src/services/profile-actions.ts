'use server';

import { redirect } from 'next/navigation';
import { UserTypeEnum } from '@golden-events/shared';
import { CREATE_EVENT_PATH } from '@/components/layout/nav-links';
import { getCurrentUser } from './auth';
import { sendWithAuth, type ActionResult } from './authenticated-api';

const SESSION_EXPIRED: ActionResult = {
  success: false,
  message: 'Sua sessão expirou. Entre novamente.',
};

type ProfilePayload = {
  name: string;
};

// O id vem da sessão, nunca do navegador: só dá para editar o próprio perfil
export async function updateProfile(
  payload: ProfilePayload,
): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return SESSION_EXPIRED;
  }

  return sendWithAuth(
    `/users/${user.id}`,
    'PATCH',
    payload,
    'Perfil atualizado com sucesso!',
  );
}

// Só retorna quando falha; no sucesso já leva para a criação do primeiro evento
export async function becomeOrganizer(): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return SESSION_EXPIRED;
  }

  const result = await sendWithAuth(
    `/users/${user.id}`,
    'PATCH',
    { userTypeId: UserTypeEnum.ORGANIZER },
    'Agora você é organizador!',
  );

  if (!result.success) {
    return result;
  }

  redirect(CREATE_EVENT_PATH);
}
