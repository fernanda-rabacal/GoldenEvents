import { createHash, randomBytes } from 'crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { googleOAuthCookie } from '@/utils/auth_cookie';
import {
  GOOGLE_LOGIN_ERROR_PATH,
  getSafeRedirect,
} from '@/utils/auth_redirect';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

// O state e o code_verifier ficam num cookie httpOnly: o callback só aceita a volta do login que começou aqui
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.redirect(new URL(GOOGLE_LOGIN_ERROR_PATH, request.url));
  }

  const { searchParams } = request.nextUrl;
  const state = randomBytes(16).toString('base64url');
  const codeVerifier = randomBytes(32).toString('base64url');
  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  const url = new URL(GOOGLE_AUTH_URL);
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString();

  const response = NextResponse.redirect(url);
  response.cookies.set(
    googleOAuthCookie({
      state,
      codeVerifier,
      redirectTo: getSafeRedirect(searchParams.get('redirect') ?? undefined),
      keepConnected: searchParams.get('keep') === '1',
    }),
  );

  return response;
}
