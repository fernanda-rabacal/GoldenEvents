import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '@golden-events/shared';
import { buildLoginHref } from '@/utils/auth_redirect';
import { fetchFromApi } from './api';

export const AUTH_COOKIE = 'golden_token';

export async function getAuthToken() {
  return (await cookies()).get(AUTH_COOKIE)?.value;
}

export async function getCurrentUser() {
  const token = await getAuthToken();

  if (!token) {
    return null;
  }

  return fetchFromApi<User | null>('/users/token', null, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
}

// Para páginas que exigem login: volta para a página depois de entrar
export async function requireUser(redirectTo: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(buildLoginHref(redirectTo));
  }

  return user;
}
