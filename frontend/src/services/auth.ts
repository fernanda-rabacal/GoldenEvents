import { cookies } from 'next/headers';
import type { User } from '@golden-events/shared';
import { fetchFromApi } from './api';

export const AUTH_COOKIE = 'golden_token';

export async function getCurrentUser() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return fetchFromApi<User | null>('/users/token', null, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
}
