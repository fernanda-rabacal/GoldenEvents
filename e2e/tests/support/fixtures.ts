import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';
import { createEvent, createUser, login, type TestEvent, type TestUser } from './api.js';

export const APPROVED_CARD = '4242 4242 4242 4242';
export const DECLINED_CARD = '4000 0000 0000 0002';

type Buyer = TestUser & { token: string };

type Fixtures = {
  buyer: Buyer;
  organizer: Buyer;
  event: TestEvent;
};

export async function authenticate(context: BrowserContext, token: string) {
  await context.addCookies([
    {
      name: 'golden_token',
      value: token,
      url: process.env.E2E_BASE_URL!,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

async function createLoggedUser(isOrganizer: boolean) {
  const user = await createUser({ isOrganizer });

  return { ...user, token: await login(user) };
}

export const test = base.extend<Fixtures>({
  buyer: async ({ context }, use) => {
    const buyer = await createLoggedUser(false);

    await authenticate(context, buyer.token);
    await use(buyer);
  },
  organizer: async ({}, use) => {
    await use(await createLoggedUser(true));
  },
  event: async ({ organizer }, use) => {
    await use(await createEvent(organizer.token));
  },
});

export { expect };

// O anunciador de rotas do Next também tem role="alert": o toast é procurado só na região do react-toastify
export function toast(page: Page, text: string | RegExp) {
  return page.getByRole('region', { name: /Notifications/ }).getByRole('alert').filter({ hasText: text });
}

export async function fillCard(page: Page, number = APPROVED_CARD) {
  await page.getByLabel('Número do cartão').fill(number);
  await page.getByLabel('Nome do titular').fill('Pessoa Teste');
  await page.getByLabel('Mês').selectOption('12');
  await page.getByLabel('Ano').selectOption(String(new Date().getFullYear() + 2));
  await page.getByLabel('CVV').fill('123');
}

export async function startCheckout(page: Page, event: Pick<TestEvent, 'slug' | 'name'>, quantity = 1) {
  await page.goto(`/eventos/${event.slug}`);
  await expect(page.getByRole('heading', { level: 1, name: event.name })).toBeVisible();

  await page.getByRole('radio', { name: /Pista/ }).check();

  for (let count = 1; count < quantity; count++) {
    await page.getByRole('button', { name: 'Aumentar quantidade' }).click();
  }

  await page.getByRole('link', { name: 'Comprar ingresso' }).click();
  await expect(page.getByRole('heading', { name: 'Finalizar compra' })).toBeVisible();
}

export async function expectTicketsInMyTickets(page: Page, event: Pick<TestEvent, 'name'>, details: string | RegExp) {
  await page.getByRole('link', { name: 'Acessar meus ingressos' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Meus ingressos' })).toBeVisible();

  const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: event.name }) });

  await expect(card).toContainText(details);
}
