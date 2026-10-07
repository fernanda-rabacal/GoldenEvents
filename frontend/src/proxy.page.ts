import { NextResponse, type NextRequest } from 'next/server';
import { buildLoginHref } from '@/utils/auth_redirect';

// Barreira rápida (só confere se o cookie existe); as páginas validam o token na API com requireUser
export default function proxy(request: NextRequest) {
  const token = request.cookies.get('golden_token');

  if (!token?.value) {
    const { pathname, search } = request.nextUrl;

    return NextResponse.redirect(
      new URL(buildLoginHref(`${pathname}${search}`), request.url),
    );
  }
}

export const config = {
  matcher: ['/organizador/:path*', '/meus-ingressos', '/perfil', '/checkout'],
};
