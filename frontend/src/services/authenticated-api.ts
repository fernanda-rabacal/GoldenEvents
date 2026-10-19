import { fetchFromApi, SERVER_UNREACHABLE_MESSAGE, sendToApi } from './api';
import { getAuthToken } from './auth';

export type ActionResult = {
  success: boolean;
  message: string;
};

export type DataActionResult<T> =
  | { success: true; message: string; data: T }
  | { success: false; message: string };

const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Entre novamente.';

// Leitura autenticada para server components: sempre atualizada, sem cache
export async function fetchWithAuth<T>(path: string) {
  const token = await getAuthToken();

  return fetchFromApi<T>(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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
  const { success, message } = await sendWithAuthForData(
    path,
    method,
    body,
    fallbackMessage,
  );

  return { success, message };
}

// Como sendWithAuth, mas também devolve o data da resposta: só para o que o navegador precisa ver
export async function sendWithAuthForData<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body: object | undefined,
  fallbackMessage: string,
): Promise<DataActionResult<T>> {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, message: SESSION_EXPIRED_MESSAGE };
  }

  const response = await sendToApi<{ data: T }>(path, method, body, token);

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

  return {
    success: true,
    message: response.message ?? fallbackMessage,
    data: response.data.data,
  };
}
