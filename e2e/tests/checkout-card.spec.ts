import { getMyOrders } from './support/api.js';
import {
  DECLINED_CARD,
  expect,
  expectTicketsInMyTickets,
  fillCard,
  startCheckout,
  test,
  toast,
} from './support/fixtures.js';

test('compra dois ingressos com cartão aprovado', async ({ page, buyer, event }) => {
  await startCheckout(page, event, 2);

  await expect(page.getByText('Ingressos (2x)')).toBeVisible();
  await fillCard(page);
  await page.getByRole('button', { name: 'Confirmar compra' }).click();

  await expect(page.getByRole('heading', { name: 'Pagamento confirmado' })).toBeVisible();
  await expectTicketsInMyTickets(page, event, '2 ingressos');

  const [order] = await getMyOrders(buyer.token);
  expect(order.status).toBe('paid');
});

test('mostra a recusa do cartão e aceita uma nova tentativa', async ({ page, buyer, event }) => {
  await startCheckout(page, event);

  await fillCard(page, DECLINED_CARD);
  await page.getByRole('button', { name: 'Confirmar compra' }).click();

  await expect(toast(page, 'Pagamento recusado pelo emissor do cartão')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Cancelar pedido' })).toBeVisible();

  await fillCard(page);
  await page.getByRole('button', { name: 'Confirmar compra' }).click();

  await expect(page.getByRole('heading', { name: 'Pagamento confirmado' })).toBeVisible();
  await expectTicketsInMyTickets(page, event, /Código/);
});

test('valida o cartão no navegador antes de criar o pedido', async ({ page, buyer, event }) => {
  await startCheckout(page, event);

  await fillCard(page, '1234 5678 9012 3456');
  await page.getByRole('button', { name: 'Confirmar compra' }).click();

  await expect(toast(page, 'Número do cartão inválido.')).toBeVisible();
  expect(await getMyOrders(buyer.token)).toHaveLength(0);
});
