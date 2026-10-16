import { NextResponse, type NextRequest } from 'next/server';
import { refreshSession } from '@/services/session-refresh';
import {
  AUTH_COOKIE,
  REFRESH_COOKIE,
  sessionCookies,
} from '@/utils/auth_cookie';
import { buildLoginHref } from '@/utils/auth_redirect';

const PROTECTED_PATHS = [
  '/organizador',
  '/meus-ingressos',
  '/perfil',
  '/checkout',
];

// O token precisa continuar valendo enquanto a página ainda chama a API
const REFRESH_MARGIN_SECONDS = 60;

function isProtected(pathname: string) {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

// Só lê o exp, sem conferir a assinatura: quem valida o token é a API
function isFresh(token: string | undefined) {
  if (!token) {
    return false;
  }

  try {
    const { exp } = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString(),
    );

    return (
      typeof exp === 'number' &&
      exp - Date.now() / 1000 > REFRESH_MARGIN_SECONDS
    );
  } catch {
    return false;
  }
}

function redirectToLogin(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  return NextResponse.redirect(
    new URL(buildLoginHref(`${pathname}${search}`), request.url),
  );
}

// Renova a sessão aqui porque Server Components não gravam cookies. Gravar também na
// requisição faz o render atual já enxergar o token novo. As páginas protegidas ainda
// validam o token na API com requireUser
export default async function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const guarded = isProtected(request.nextUrl.pathname);

  const result =
    refreshToken && !isFresh(token)
      ? await refreshSession(
          refreshToken,
          request.headers.get('x-forwarded-for'),
        )
      : null;

  if (result?.status === 'ok') {
    const cookies = sessionCookies(result.tokens);

    cookies.forEach(({ name, value }) => request.cookies.set(name, value));
    const response = NextResponse.next({
      request: { headers: request.headers },
    });
    cookies.forEach((cookie) => response.cookies.set(cookie));

    return response;
  }

  if (result?.status === 'invalid') {
    request.cookies.delete([AUTH_COOKIE, REFRESH_COOKIE]);
    const response = guarded
      ? redirectToLogin(request)
      : NextResponse.next({ request: { headers: request.headers } });
    response.cookies.delete(AUTH_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);

    return response;
  }

  // Sem sessão para renovar, ou a API fora do ar: não desloga por isso
  if (guarded && !token) {
    return redirectToLogin(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|images/|favicon.ico).*)'],
};
