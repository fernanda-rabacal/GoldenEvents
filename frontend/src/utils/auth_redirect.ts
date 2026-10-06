const LOGIN_PATH = '/login';

export function buildLoginHref(redirectTo: string) {
  return `${LOGIN_PATH}?redirect=${encodeURIComponent(redirectTo)}`;
}

// Só aceita caminhos internos, para o parâmetro não virar um redirecionamento aberto
export function getSafeRedirect(value?: string) {
  if (!value?.startsWith('/') || /^\/[/\\]/.test(value)) {
    return '/';
  }

  return value;
}
