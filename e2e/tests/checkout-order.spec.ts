import { createEvent, getMyOrders } from './support/api.js';
import { expect, startCheckout, test, toast } from './support/fixtures.js';

test('retoma o pedido em aberto ao voltar para o checkout', async ({ page, buyer, event }) => {
  await startCheckout(page, event, 2);

  await page.getByRole('radio', { name: 'Pix' }).check();
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(page.getByRole('img', { name: 'QR Code para pagamento via Pix' })).toBeVisible();

  const checkoutUrl = page.url();
  await page.goto(`/eventos/${event.slug}`);
  await page.goto(checkoutUrl);

  await expect(page.getByText('Você já tem um pedido aguardando pagamento para este evento.')).toBeVisible();
  await expect(page.getByText(/Ingressos reservados por/)).toBeVisible();
  await expect(page.getByText('Ingressos (2x)')).toBeVisible();

  const orders = await getMyOrders(buyer.token);
  expect(orders).toHaveLength(1);
});

test('cancela o pedido e devolve para a página do evento', async ({ page, buyer, event }) => {
  await startCheckout(page, event);

  await page.getByRole('radio', { name: 'Pix' }).check();
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(page.getByRole('img', { name: 'QR Code para pagamento via Pix' })).toBeVisible();

  await page.getByRole('button', { name: 'Cancelar pedido' }).click();

  await expect(toast(page, 'Pedido cancelado')).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/eventos/${event.slug}$`));

  const [order] = await getMyOrders(buyer.token);
  expect(order.status).toBe('cancelled');
});

test('confirma um evento gratuito sem pagamento', async ({ page, buyer, organizer }) => {
  const event = await createEvent(organizer.token, [{ name: 'Entrada franca', price: 0, quantity: 50 }]);

  await startCheckout(page, event);

  await expect(page.getByText('Este evento é gratuito')).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar compra' }).click();

  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible();

  const [order] = await getMyOrders(buyer.token);
  expect(order.status).toBe('paid');
});
