import { randomUUID } from 'node:crypto';

const API_URL = process.env.E2E_API_URL!;

export const DEFAULT_PASSWORD = 'senha-e2e-123';

export type TestUser = { name: string; email: string; password: string };

export type TestEvent = { id: number; slug: string; name: string; lotId: number };

export type LotInput = { name: string; price: number; quantity: number };

export type Order = { id: string; event_id: number; status: string };

async function request<T>(path: string, init: { method?: string; token?: string; body?: object } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(init.token && { Authorization: `Bearer ${init.token}` }),
    },
    body: init.body && JSON.stringify(init.body),
  });

  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path} respondeu ${response.status}: ${await response.text()}`);
  }

  return (await response.json()) as T;
}

function uniqueSuffix() {
  return randomUUID().slice(0, 8);
}

export function generateCpf() {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));

  for (const length of [9, 10]) {
    const sum = digits.reduce((total, digit, index) => total + digit * (length + 1 - index), 0);
    const rest = (sum * 10) % 11;

    digits.push(rest === 10 ? 0 : rest);
  }

  return digits.join('');
}

export function newUserData(): TestUser {
  const suffix = uniqueSuffix();

  return { name: `Pessoa Teste ${suffix}`, email: `e2e-${suffix}@golden.test`, password: DEFAULT_PASSWORD };
}

export async function createUser({ isOrganizer = false } = {}) {
  const user = newUserData();

  await request('/users', {
    method: 'POST',
    body: { ...user, document: generateCpf(), isOrganizer },
  });

  return user;
}

export async function login({ email, password }: Pick<TestUser, 'email' | 'password'>) {
  const { token } = await request<{ token: string }>('/login', {
    method: 'POST',
    body: { email, password },
  });

  return token;
}

export async function createEvent(
  token: string,
  lots: LotInput[] = [{ name: 'Lote único', price: 4500, quantity: 20 }],
): Promise<TestEvent> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() + 1);

  const { data } = await request<{
    data: { id: number; slug: string; name: string; sectors: { lots: { id: number }[] }[] };
  }>('/events', {
    method: 'POST',
    token,
    body: {
      name: `Evento E2E ${uniqueSuffix()}`,
      description:
        'Evento criado pelos testes de ponta a ponta, com uma descrição de pelo menos cem caracteres para passar na validação.',
      location: 'Rua do Limoeiro, 12, Salvador - BA',
      categoryId: 1,
      startDateTime: startDate.toISOString(),
      sectors: [{ name: 'Pista', lots }],
    },
  });

  return { id: data.id, slug: data.slug, name: data.name, lotId: data.sectors[0].lots[0].id };
}

export function getMyOrders(token: string) {
  return request<Order[]>('/orders', { token });
}
