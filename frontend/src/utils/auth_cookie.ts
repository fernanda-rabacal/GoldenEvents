import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from '@golden-events/shared';

export const AUTH_COOKIE = 'golden_token';
export const REFRESH_COOKIE = 'golden_refresh';
export const GOOGLE_OAUTH_COOKIE = 'golden_oauth';
export const GOOGLE_SIGNUP_COOKIE = 'golden_google_signup';

// Mesma duração do signupToken da API e tempo de sobra para a pessoa escolher a conta no Google
const GOOGLE_FLOW_MAX_AGE_SECONDS = 10 * 60;

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

export type GoogleOAuthState = {
  state: string;
  codeVerifier: string;
  redirectTo: string;
  keepConnected: boolean;
};

export function googleOAuthCookie(value: GoogleOAuthState) {
  return {
    ...COOKIE_OPTIONS,
    name: GOOGLE_OAUTH_COOKIE,
    value: JSON.stringify(value),
    maxAge: GOOGLE_FLOW_MAX_AGE_SECONDS,
  };
}

export function parseGoogleOAuthCookie(
  value: string | undefined,
): GoogleOAuthState | null {
  try {
    return value ? (JSON.parse(value) as GoogleOAuthState) : null;
  } catch {
    return null;
  }
}

export function googleSignupCookie(signupToken: string) {
  return {
    ...COOKIE_OPTIONS,
    name: GOOGLE_SIGNUP_COOKIE,
    value: signupToken,
    maxAge: GOOGLE_FLOW_MAX_AGE_SECONDS,
  };
}
