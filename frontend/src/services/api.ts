export const API_URL = process.env.API_URL ?? 'http://localhost:8080';

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
