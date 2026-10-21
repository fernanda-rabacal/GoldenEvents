'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  AUTH_COOKIE,
  GOOGLE_SIGNUP_COOKIE,
  REFRESH_COOKIE,
  sessionCookies,
  type SessionTokens,
} from '@/utils/auth_cookie';
import { getSafeRedirect } from '@/utils/auth_redirect';
import { SERVER_UNREACHABLE_MESSAGE, sendToApi } from './api';
import type { ActionResult } from './authenticated-api';

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

// Só retorna quando falha; no sucesso grava os cookies e já leva para o destino
export async function signIn(
  { email, password, keep_connected }: SignInPayload,
  redirectTo: string,
): Promise<ActionResult> {
  const response = await sendToApi<Partial<SessionTokens>>('/login', 'POST', {
    email,
    password,
    keepConnected: keep_connected,
  });

  if (!response) {
    return { success: false, message: SERVER_UNREACHABLE_MESSAGE };
  }

  const { token, refreshToken, keepConnected } = response.data;

  if (!response.ok || !token || !refreshToken) {
    return {
      success: false,
      message: response.message ?? 'Não foi possível entrar. Tente novamente.',
    };
  }

  const cookieStore = await cookies();

  for (const cookie of sessionCookies({
    token,
    refreshToken,
    keepConnected: Boolean(keepConnected),
  })) {
    cookieStore.set(cookie);
  }

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

type GoogleSignUpPayload = {
  document: string;
  isOrganizer: boolean;
};

// O signupToken veio do callback do Google num cookie httpOnly; aqui ele vira conta e sessão
export async function completeGoogleSignUp(
  { document, isOrganizer }: GoogleSignUpPayload,
  redirectTo: string,
): Promise<ActionResult> {
  const cookieStore = await cookies();
  const signupToken = cookieStore.get(GOOGLE_SIGNUP_COOKIE)?.value;

  if (!signupToken) {
    return {
      success: false,
      message:
        'O tempo para concluir o cadastro acabou. Entre com o Google de novo.',
    };
  }

  const response = await sendToApi<Partial<SessionTokens>>(
    '/signup/google',
    'POST',
    { signupToken, document, isOrganizer },
  );

  if (!response) {
    return { success: false, message: SERVER_UNREACHABLE_MESSAGE };
  }

  const { token, refreshToken, keepConnected } = response.data;

  if (!response.ok || !token || !refreshToken) {
    return {
      success: false,
      message:
        response.message ??
        'Não foi possível concluir o cadastro. Tente novamente.',
    };
  }

  cookieStore.delete(GOOGLE_SIGNUP_COOKIE);

  for (const cookie of sessionCookies({
    token,
    refreshToken,
    keepConnected: Boolean(keepConnected),
  })) {
    cookieStore.set(cookie);
  }

  redirect(getSafeRedirect(redirectTo));
}

// Encerra a sessão na API para o refresh token não valer mais, mesmo se o cookie vazou
export async function signOut() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    await sendToApi('/logout', 'POST', { refreshToken });
  }

  cookieStore.delete(AUTH_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  redirect('/');
}
