import { headers } from 'next/headers';

export const API_URL = process.env.API_URL ?? 'http://localhost:8080';

export const SERVER_UNREACHABLE_MESSAGE =
  'Não foi possível falar com o servidor. Tente novamente.';

export class ApiError extends Error {
  status: number;

  constructor(status: number, path: string) {
    super(`A API respondeu ${status} ao buscar ${path}`);
    this.status = status;
  }
}

// Leitura para server components: a falha sobe para o error.tsx da rota, que oferece tentar de novo
export async function fetchFromApi<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);

  if (!response.ok) {
    throw new ApiError(response.status, path);
  }

  return (await response.json()) as T;
}

export type ApiResponse<T> = {
  ok: boolean;
  status: number;
  data: T;
  message?: string;
};

// A API limita o login e o cadastro por IP. Sem informar o IP do navegador, todo mundo
// chegaria lá com o IP deste servidor e dividiria o mesmo limite. A chave prova à API que
// o IP veio daqui
async function getClientIpHeaders() {
  const key = process.env.INTERNAL_API_KEY;
  // O proxy na frente do Next (Vercel, nginx) sobrescreve o header ou acrescenta no fim: o último é o real
  const ip = (await headers()).get('x-forwarded-for')?.split(',').pop()?.trim();

  return key && ip ? { 'X-Internal-Key': key, 'X-Client-IP': ip } : undefined;
}

// Só para server actions, que têm uma requisição do navegador para repassar.
// Retorna null quando a API não responde
export async function sendToApi<T = Record<string, unknown>>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: object,
  token?: string,
): Promise<ApiResponse<T> | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(await getClientIpHeaders()),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    const message = Array.isArray(data.message)
      ? data.message.join(' ')
      : data.message;

    return { ok: response.ok, status: response.status, data, message };
  } catch {
    return null;
  }
}
