import type { Page } from '@playwright/test';
import { createUser, generateCpf, newUserData, type TestUser } from './support/api.js';
import { expect, test, toast } from './support/fixtures.js';

const DAY_SECONDS = 86_400;

async function signIn(page: Page, user: TestUser, { keepConnected = false } = {}) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(user.email);
  await page.getByLabel('Senha', { exact: true }).fill(user.password);
  await page.getByLabel('Manter conectado').setChecked(keepConnected);
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();
  await expect(page.getByRole('button', { name: user.name.split(' ')[0] })).toBeVisible();
}

async function sessionCookies(page: Page) {
  const cookies = await page.context().cookies();

  return {
    access: cookies.find(cookie => cookie.name === 'golden_token'),
    refresh: cookies.find(cookie => cookie.name === 'golden_refresh'),
  };
}

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

test('mantém a sessão por 30 dias com "Manter conectado"', async ({ page }) => {
  const user = await createUser();
  const now = Date.now() / 1000;

  await signIn(page, user, { keepConnected: true });

  const { access, refresh } = await sessionCookies(page);
  expect(access?.expires).toBeGreaterThan(now + 14 * 60);
  expect(access?.expires).toBeLessThan(now + 16 * 60);
  expect(refresh?.expires).toBeGreaterThan(now + 29 * DAY_SECONDS);
  expect(refresh?.httpOnly).toBe(true);
});

test('sem "Manter conectado", a sessão acaba ao fechar o navegador', async ({ page }) => {
  await signIn(page, await createUser());

  const { access, refresh } = await sessionCookies(page);
  expect(access?.expires).toBe(-1);
  expect(refresh?.expires).toBe(-1);
});

test('renova a sessão quando o token de acesso expira', async ({ page }) => {
  const user = await createUser();
  await signIn(page, user, { keepConnected: true });
  const before = await sessionCookies(page);

  await page.context().clearCookies({ name: 'golden_token' });
  await page.goto('/perfil');

  await expect(page).toHaveURL(/\/perfil$/);
  await expect(page.getByRole('button', { name: user.name.split(' ')[0] })).toBeVisible();

  const after = await sessionCookies(page);
  expect(after.access?.value).toBeTruthy();
  expect(after.refresh?.value).not.toBe(before.refresh?.value);
});

test('sair encerra a sessão também na API', async ({ page }) => {
  const user = await createUser();
  await signIn(page, user, { keepConnected: true });
  const { refresh } = await sessionCookies(page);

  await page.getByRole('button', { name: user.name.split(' ')[0] }).click();
  await page.getByRole('menuitem', { name: 'Sair da conta' }).click();
  await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible();

  // Um refresh token copiado antes de sair não pode reabrir a sessão
  await page.context().addCookies([refresh!]);
  await page.goto('/meus-ingressos');

  await expect(page).toHaveURL(/\/login\?redirect=%2Fmeus-ingressos/);
});
