import type { SessionTokens } from '@/utils/auth_cookie';
import { API_URL, buildClientIpHeaders } from './api';

export type RefreshResult =
  | { status: 'ok'; tokens: SessionTokens }
  | { status: 'invalid' }
  | { status: 'unavailable' };

// Para o proxy, que não tem next/headers: o IP do navegador vem como argumento
export async function refreshSession(
  refreshToken: string,
  forwardedFor: string | null,
): Promise<RefreshResult> {
  try {
    const response = await fetch(`${API_URL}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildClientIpHeaders(forwardedFor),
      },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });

    if (response.status === 400 || response.status === 401) {
      return { status: 'invalid' };
    }

    if (!response.ok) {
      return { status: 'unavailable' };
    }

    return { status: 'ok', tokens: (await response.json()) as SessionTokens };
  } catch {
    return { status: 'unavailable' };
  }
}
