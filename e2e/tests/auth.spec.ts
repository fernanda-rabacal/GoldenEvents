import { createUser, generateCpf, newUserData } from './support/api.js';
import { expect, test, toast } from './support/fixtures.js';

test('cadastra uma conta e entra com ela', async ({ page }) => {
  const user = newUserData();

  await page.goto('/cadastro');
  await page.getByLabel('Nome completo').fill(user.name);
  await page.getByLabel('CPF').fill(generateCpf());
  await page.getByLabel('E-mail').fill(user.email);
  await page.getByLabel('Senha', { exact: true }).fill(user.password);
  await page.getByLabel('Confirmar senha', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Criar minha conta' }).click();

  await expect(toast(page, 'Cadastro feito com sucesso')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('E-mail').fill(user.email);
  await page.getByLabel('Senha', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();

  await expect(page.getByRole('button', { name: user.name.split(' ')[0] })).toBeVisible();
});

test('leva ao login e volta para a página protegida depois de entrar', async ({ page }) => {
  const user = await createUser();

  await page.goto('/meus-ingressos');
  await expect(page).toHaveURL(/\/login\?redirect=%2Fmeus-ingressos/);

  await page.getByLabel('E-mail').fill(user.email);
  await page.getByLabel('Senha', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();

  await expect(page).toHaveURL(/\/meus-ingressos$/);
  await expect(page.getByText('Você ainda não tem ingressos')).toBeVisible();
});

test('recusa uma senha errada', async ({ page }) => {
  const user = await createUser();

  await page.goto('/login');
  await page.getByLabel('E-mail').fill(user.email);
  await page.getByLabel('Senha', { exact: true }).fill('senha-errada');
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();

  await expect(toast(page, 'Credenciais Inválidas.')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
