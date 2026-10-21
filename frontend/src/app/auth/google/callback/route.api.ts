import { NextResponse, type NextRequest } from 'next/server';
import { sendToApi } from '@/services/api';
import {
  GOOGLE_OAUTH_COOKIE,
  googleSignupCookie,
  parseGoogleOAuthCookie,
  sessionCookies,
  type SessionTokens,
} from '@/utils/auth_cookie';
import {
  GOOGLE_LOGIN_ERROR_PATH,
  getSafeRedirect,
} from '@/utils/auth_redirect';

type GoogleLoginResponse = Partial<SessionTokens> & {
  signupRequired?: boolean;
  signupToken?: string;
};

function redirectTo(path: string, request: NextRequest) {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.cookies.delete(GOOGLE_OAUTH_COOKIE);

  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const flow = parseGoogleOAuthCookie(
    request.cookies.get(GOOGLE_OAUTH_COOKIE)?.value,
  );
  const code = searchParams.get('code');

  // Sem code quando a pessoa cancela no Google; state diferente é uma volta que não começou aqui
  if (!flow || !code || searchParams.get('state') !== flow.state) {
    return redirectTo(GOOGLE_LOGIN_ERROR_PATH, request);
  }

  const result = await sendToApi<GoogleLoginResponse>('/login/google', 'POST', {
    code,
    codeVerifier: flow.codeVerifier,
    keepConnected: flow.keepConnected,
  });

  if (!result?.ok) {
    return redirectTo(GOOGLE_LOGIN_ERROR_PATH, request);
  }

  const { token, refreshToken, keepConnected, signupToken } = result.data;

  if (signupToken) {
    const params = new URLSearchParams({ redirect: flow.redirectTo });
    const response = redirectTo(`/cadastro/google?${params}`, request);
    response.cookies.set(googleSignupCookie(signupToken));

    return response;
  }

  if (!token || !refreshToken) {
    return redirectTo(GOOGLE_LOGIN_ERROR_PATH, request);
  }

  const response = redirectTo(getSafeRedirect(flow.redirectTo), request);

  for (const cookie of sessionCookies({
    token,
    refreshToken,
    keepConnected: Boolean(keepConnected),
  })) {
    response.cookies.set(cookie);
  }

  return response;
}
