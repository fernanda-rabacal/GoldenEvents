import { API_URL, fetchFromApi } from './api';
import { getAuthToken } from './auth';

export type ActionResult = {
  success: boolean;
  message: string;
};

const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Entre novamente.';

// Leitura autenticada para server components: sempre atualizada, sem cache
export async function fetchWithAuth<T>(path: string, fallback: T) {
  const token = await getAuthToken();

  if (!token) {
    return fallback;
  }

  return fetchFromApi<T>(path, fallback, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
}

// Escrita autenticada para server actions: devolve a mensagem da API para o toast
export async function sendWithAuth(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body: object | undefined,
  fallbackMessage: string,
): Promise<ActionResult> {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, message: SESSION_EXPIRED_MESSAGE };
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    const message = Array.isArray(data.message)
      ? data.message.join(' ')
      : data.message;

    if (!response.ok) {
      return {
        success: false,
        message:
          response.status === 401
            ? SESSION_EXPIRED_MESSAGE
            : (message ?? fallbackMessage),
      };
    }

    return { success: true, message: message ?? fallbackMessage };
  } catch {
    return {
      success: false,
      message: 'Não foi possível falar com o servidor. Tente novamente.',
    };
  }
}
