const LOGIN_PATH = '/login';

export function buildLoginHref(redirectTo: string) {
  return `${LOGIN_PATH}?redirect=${encodeURIComponent(redirectTo)}`;
}

export const GOOGLE_LOGIN_ERROR_PATH = `${LOGIN_PATH}?erro=google`;

export function buildGoogleLoginHref(
  redirectTo: string,
  keepConnected: boolean,
) {
  const params = new URLSearchParams({ redirect: redirectTo });

  if (keepConnected) {
    params.set('keep', '1');
  }

  return `/auth/google?${params}`;
}

// Só aceita caminhos internos, para o parâmetro não virar um redirecionamento aberto
export function getSafeRedirect(value?: string) {
  if (!value?.startsWith('/') || /^\/[/\\]/.test(value)) {
    return '/';
  }

  return value;
}
