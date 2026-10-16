import { expect, expectTicketsInMyTickets, fillCard, startCheckout, test } from './support/fixtures.js';

test('paga com Pix pelo simulador do provedor', async ({ page, buyer, event }) => {
  await startCheckout(page, event);

  await page.getByRole('radio', { name: 'Pix' }).check();
  await page.getByRole('button', { name: 'Confirmar compra' }).click();

  await expect(page.getByRole('img', { name: 'QR Code para pagamento via Pix' })).toBeVisible();
  await expect(page.getByLabel('Ou use o Pix copia e cola')).not.toHaveValue('');
  await expect(page.getByText('Aguardando a confirmação do pagamento...')).toBeVisible();

  await page.getByRole('button', { name: 'Simular pagamento (ambiente de testes)' }).click();

  await expect(page.getByRole('heading', { name: 'Pagamento confirmado' })).toBeVisible();
  await expectTicketsInMyTickets(page, event, /Código/);
});

test('troca o Pix pelo cartão antes de pagar', async ({ page, buyer, event }) => {
  await startCheckout(page, event);

  await page.getByRole('radio', { name: 'Pix' }).check();
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(page.getByRole('img', { name: 'QR Code para pagamento via Pix' })).toBeVisible();

  await page.getByRole('button', { name: 'Escolher outra forma de pagamento' }).click();
  await page.getByRole('radio', { name: 'Cartão de Crédito' }).check();
  await fillCard(page);
  await page.getByRole('button', { name: 'Confirmar compra' }).click();

  await expect(page.getByRole('heading', { name: 'Pagamento confirmado' })).toBeVisible();
  await expectTicketsInMyTickets(page, event, /Código/);
});
