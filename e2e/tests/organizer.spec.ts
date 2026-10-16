import { createUser, login } from './support/api.js';
import { authenticate, expect, fillCard, startCheckout, test } from './support/fixtures.js';

function nextMonthInputValue() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);

  return `${date.toISOString().slice(0, 10)}T20:00`;
}

test('cria um evento pelo painel e acompanha a venda', async ({ page, context, browser, organizer }) => {
  const eventName = `Show E2E ${Date.now()}`;

  await authenticate(context, organizer.token);
  await page.goto('/organizador/eventos/criar');

  await page.getByLabel('Nome do evento').fill(eventName);
  await page.getByLabel('Local do evento').fill('Parque da Cidade, Salvador - BA');
  await page.getByLabel('Categoria do evento').selectOption({ index: 1 });
  await page.getByLabel('Data de início').fill(nextMonthInputValue());
  await page.getByLabel('Nome do setor').fill('Pista');
  await page.getByLabel('Preço').fill('5000');
  await expect(page.getByLabel('Preço')).toHaveValue(/50,00/);
  await page.getByLabel('Quantidade').fill('30');
  await page.locator('[contenteditable="true"]').fill(
    'Um show de teste criado pelo painel do organizador, com uma descrição longa o bastante para passar na validação do formulário.',
  );
  await page.getByRole('button', { name: 'Criar evento' }).click();

  await expect(page).toHaveURL(/\/organizador\/meus-eventos$/);
  await page.getByRole('link', { name: `Ver a página de ${eventName}` }).click();

  await expect(page.getByRole('heading', { level: 1, name: eventName })).toBeVisible();
  const slug = new URL(page.url()).pathname.split('/').pop()!;

  const buyerContext = await browser.newContext();
  const buyerPage = await buyerContext.newPage();
  await authenticate(buyerContext, await login(await createUser()));

  await startCheckout(buyerPage, { slug, name: eventName });
  await fillCard(buyerPage);
  await buyerPage.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(buyerPage.getByRole('heading', { name: 'Pagamento confirmado' })).toBeVisible();
  await buyerContext.close();

  await page.goto('/organizador');
  await expect(
    page.getByText('Ingressos vendidos', { exact: true }).locator('xpath=following-sibling::p[1]'),
  ).toHaveText('1');
});

test('manda quem não organiza eventos para a página de virar organizador', async ({ page, buyer }) => {
  await page.goto('/organizador');

  await expect(page).toHaveURL(/\/seja-organizador$/);
});
