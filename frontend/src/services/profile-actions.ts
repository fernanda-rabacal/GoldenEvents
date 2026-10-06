'use server';

import { getCurrentUser } from './auth';
import { sendWithAuth, type ActionResult } from './authenticated-api';

type ProfilePayload = {
  name: string;
  userTypeId: number;
};

// O id vem da sessão, nunca do navegador: só dá para editar o próprio perfil
export async function updateProfile(
  payload: ProfilePayload,
): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      message: 'Sua sessão expirou. Entre novamente.',
    };
  }

  return sendWithAuth(
    `/users/${user.id}`,
    'PATCH',
    payload,
    'Perfil atualizado com sucesso!',
  );
}
