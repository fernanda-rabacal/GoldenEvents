'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE } from '@/utils/auth_cookie';
import { getSafeRedirect } from '@/utils/auth_redirect';
import { SERVER_UNREACHABLE_MESSAGE, sendToApi } from './api';
import type { ActionResult } from './authenticated-api';

const ONE_HOUR = 60 * 60;
const THIRTY_DAYS = 60 * 60 * 24 * 30;

type SignInPayload = {
  email: string;
  password: string;
  keep_connected: boolean;
};

type SignUpPayload = {
  name: string;
  email: string;
  password: string;
  document: string;
  isOrganizer: boolean;
};

// Só retorna quando falha; no sucesso grava o cookie e já leva para o destino
export async function signIn(
  { email, password, keep_connected }: SignInPayload,
  redirectTo: string,
): Promise<ActionResult> {
  const response = await sendToApi<{ token?: string }>('/login', 'POST', {
    email,
    password,
  });

  if (!response) {
    return { success: false, message: SERVER_UNREACHABLE_MESSAGE };
  }

  if (!response.ok || !response.data.token) {
    return {
      success: false,
      message: response.message ?? 'Não foi possível entrar. Tente novamente.',
    };
  }

  (await cookies()).set(AUTH_COOKIE, response.data.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: keep_connected ? THIRTY_DAYS : ONE_HOUR,
  });

  redirect(getSafeRedirect(redirectTo));
}

export async function signUp(payload: SignUpPayload): Promise<ActionResult> {
  const response = await sendToApi('/users', 'POST', payload);

  if (!response) {
    return { success: false, message: SERVER_UNREACHABLE_MESSAGE };
  }

  if (!response.ok) {
    return {
      success: false,
      message:
        response.message ??
        'Não foi possível concluir o cadastro. Tente novamente.',
    };
  }

  return {
    success: true,
    message: 'Cadastro feito com sucesso! Agora é só entrar.',
  };
}

export async function signOut() {
  (await cookies()).delete(AUTH_COOKIE);
  redirect('/');
}
