export const API_URL = process.env.API_URL ?? 'http://localhost:8080';

export const SERVER_UNREACHABLE_MESSAGE =
  'Não foi possível falar com o servidor. Tente novamente.';

export async function fetchFromApi<T>(
  path: string,
  fallback: T,
  init?: RequestInit,
): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, init);

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    // Com a API fora do ar a página renderiza com o fallback em vez de quebrar
    console.error(`Erro ao buscar ${path} na API:`, error);
    return fallback;
  }
}

export type ApiResponse<T> = {
  ok: boolean;
  status: number;
  data: T;
  message?: string;
};

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
