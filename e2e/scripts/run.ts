import { execFileSync, spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createWriteStream, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';

// O webServer do Playwright sobe antes do globalSetup, então não recebe a URL de um banco criado
// lá. Este script sobe os containers, a API e o Next e só depois chama o Playwright

const API_PORT = 8090;
const WEB_PORT = 3100;
const API_URL = `http://localhost:${API_PORT}`;
const WEB_URL = `http://localhost:${WEB_PORT}`;
const READY_TIMEOUT_MS = 120_000;

const e2eDir = path.resolve(import.meta.dirname, '..');
const backendDir = path.resolve(e2eDir, '../backend');
const frontendDir = path.resolve(e2eDir, '../frontend');
const logsDir = path.join(e2eDir, '.logs');

const require = createRequire(import.meta.url);
const resolveFrom = (dir: string, id: string) => require.resolve(id, { paths: [dir] });

const servers: ChildProcess[] = [];
let postgres: StartedPostgreSqlContainer | undefined;
let redis: StartedTestContainer | undefined;

function baseEnv() {
  const { NODE_ENV: _nodeEnv, ...env } = process.env;

  return env;
}

function startServer(name: string, cwd: string, args: string[], env: NodeJS.ProcessEnv) {
  const log = createWriteStream(path.join(logsDir, `${name}.log`));
  const child = spawn(process.execPath, args, {
    cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    // Fora do Windows, um grupo próprio permite derrubar o processo com os filhos
    detached: process.platform !== 'win32',
  });

  child.stdout?.pipe(log);
  child.stderr?.pipe(log);
  servers.push(child);

  return child;
}

function stopServer(child: ChildProcess) {
  if (child.exitCode !== null || !child.pid) {
    return;
  }

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
  }
}

async function waitUntilReady(name: string, url: string, child: ChildProcess) {
  const deadline = Date.now() + READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      break;
    }

    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      // ainda subindo
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const log = readFileSync(path.join(logsDir, `${name}.log`), 'utf8');

  throw new Error(`${name} não respondeu em ${url}. Últimas linhas do log:\n${log.slice(-3000)}`);
}

async function cleanup() {
  servers.forEach(stopServer);
  await Promise.allSettled([postgres?.stop(), redis?.stop()]);
}

async function main() {
  mkdirSync(logsDir, { recursive: true });

  console.log('Subindo Postgres e Redis...');
  [postgres, redis] = await Promise.all([
    new PostgreSqlContainer('postgres:16-alpine').start(),
    new GenericContainer('redis:7-alpine').withExposedPorts(6379).start(),
  ]);

  const databaseUrl = postgres.getConnectionUri();
  const redisUrl = `redis://${redis.getHost()}:${redis.getMappedPort(6379)}`;
  const internalApiKey = randomBytes(32).toString('hex');

  // NODE_ENV=test: o seed cria só os dados de referência e os usuários, sem eventos
  const apiEnv = {
    ...baseEnv(),
    NODE_ENV: 'test',
    PORT: String(API_PORT),
    DATABASE_URL: databaseUrl,
    REDIS_URL: redisUrl,
    SECRET: randomBytes(64).toString('base64'),
    PAYMENT_PROVIDER: 'fake',
    FAKE_GATEWAY_SIMULATOR: 'on',
    FAKE_GATEWAY_WEBHOOK_SECRET: randomBytes(16).toString('hex'),
    RATE_LIMIT: 'off',
    INTERNAL_API_KEY: internalApiKey,
    OUTBOX_POLL_INTERVAL_MS: '100',
  };

  console.log('Aplicando as migrations e o seed...');
  execFileSync(process.execPath, [resolveFrom(backendDir, 'prisma/build/index.js'), 'migrate', 'deploy'], {
    cwd: backendDir,
    env: apiEnv,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [resolveFrom(backendDir, 'tsx/cli'), 'prisma/seeds/seed.ts'], {
    cwd: backendDir,
    env: apiEnv,
    stdio: 'inherit',
  });

  console.log(`Subindo a API em ${API_URL} e o site em ${WEB_URL} (logs em e2e/.logs)...`);
  // Um único processo da API: o FakeGateway guarda as cobranças em memória
  const api = startServer('api', backendDir, ['dist/src/main.js'], apiEnv);
  const web = startServer(
    'web',
    frontendDir,
    [resolveFrom(frontendDir, 'next/dist/bin/next'), 'start', '-p', String(WEB_PORT)],
    {
      ...baseEnv(),
      API_URL,
      INTERNAL_API_KEY: internalApiKey,
      FAKE_GATEWAY_SIMULATOR: 'on',
      TZ: 'America/Sao_Paulo',
    },
  );

  await Promise.all([
    waitUntilReady('api', `${API_URL}/events/categories`, api),
    waitUntilReady('web', WEB_URL, web),
  ]);

  const playwright = spawn(
    process.execPath,
    [resolveFrom(e2eDir, '@playwright/test/cli'), 'test', ...process.argv.slice(2)],
    {
      cwd: e2eDir,
      stdio: 'inherit',
      env: { ...process.env, E2E_BASE_URL: WEB_URL, E2E_API_URL: API_URL },
    },
  );

  return new Promise<number>(resolve => playwright.on('exit', code => resolve(code ?? 1)));
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void cleanup().finally(() => process.exit(130));
  });
}

let exitCode = 1;

try {
  exitCode = await main();
} catch (error) {
  console.error(error);
} finally {
  await cleanup();
}

process.exit(exitCode);
