import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from '@golden-events/shared';

export const AUTH_COOKIE = 'golden_token';
export const REFRESH_COOKIE = 'golden_refresh';

export type SessionTokens = {
  token: string;
  refreshToken: string;
  keepConnected: boolean;
};

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
} as const;

// Sem "manter conectado" os dois são cookies de sessão do navegador: somem ao fechá-lo
export function sessionCookies({
  token,
  refreshToken,
  keepConnected,
}: SessionTokens) {
  return [
    {
      ...COOKIE_OPTIONS,
      name: AUTH_COOKIE,
      value: token,
      ...(keepConnected && { maxAge: ACCESS_TOKEN_TTL_SECONDS }),
    },
    {
      ...COOKIE_OPTIONS,
      name: REFRESH_COOKIE,
      value: refreshToken,
      ...(keepConnected && { maxAge: REFRESH_TOKEN_TTL_SECONDS.keepConnected }),
    },
  ];
}
