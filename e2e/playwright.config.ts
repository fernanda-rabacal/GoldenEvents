import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL;

if (!baseURL) {
  throw new Error('Rode os testes com "bun run test:e2e": ele sobe o banco, a API e o site antes.');
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  // A confirmação do pagamento passa por webhook, fila, outbox e consumidor
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
