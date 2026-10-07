import { fetchFromApi, SERVER_UNREACHABLE_MESSAGE, sendToApi } from './api';
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

  const response = await sendToApi(path, method, body, token);

  if (!response) {
    return { success: false, message: SERVER_UNREACHABLE_MESSAGE };
  }

  if (!response.ok) {
    return {
      success: false,
      message:
        response.status === 401
          ? SESSION_EXPIRED_MESSAGE
          : (response.message ?? fallbackMessage),
    };
  }

  return { success: true, message: response.message ?? fallbackMessage };
}
