import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { TooManyRequestsError } from '../../app/common/errors/types/TooManyRequestsError.js';

export type RateLimitRule = {
  name: string;
  limit: number;
  windowMs: number;
  message: string;
};

type Counter = { hits: number; ttlMs: number };

// Janela fixa. INCR e PEXPIRE no mesmo script: uma queda entre os dois deixaria a chave sem prazo
const HIT = `
local hits = redis.call('INCR', KEYS[1])
if hits == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return { hits, redis.call('PTTL', KEYS[1]) }
`;

const PEEK = `
return { tonumber(redis.call('GET', KEYS[1]) or '0'), redis.call('PTTL', KEYS[1]) }
`;

function formatWait(seconds: number) {
  if (seconds < 60) {
    return seconds === 1 ? '1 segundo' : `${seconds} segundos`;
  }

  const minutes = Math.ceil(seconds / 60);

  return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
}

@Injectable()
export class RateLimitService implements OnModuleDestroy {
  private readonly logger = new Logger(RateLimitService.name);
  private connection?: Redis;

  get enabled() {
    return process.env.RATE_LIMIT !== 'off';
  }

  async consume(rule: RateLimitRule, subject: string) {
    const counter = await this.count(HIT, rule, subject);

    if (counter && counter.hits > rule.limit) {
      throw this.exceeded(rule, counter);
    }
  }

  // Para limites que só contam falhas (senha errada, cartão recusado): verifica antes da
  // tentativa e chama recordFailure depois, só quando ela falhar
  async assertAllowed(rule: RateLimitRule, subject: string) {
    const counter = await this.count(PEEK, rule, subject);

    if (counter && counter.hits >= rule.limit) {
      throw this.exceeded(rule, counter);
    }
  }

  async recordFailure(rule: RateLimitRule, subject: string) {
    await this.count(HIT, rule, subject);
  }

  async reset(rule: RateLimitRule, subject: string) {
    await this.run(redis => redis.del(this.key(rule, subject)));
  }

  onModuleDestroy() {
    this.connection?.disconnect();
  }

  private async count(script: string, rule: RateLimitRule, subject: string) {
    const result = await this.run(
      redis =>
        redis.eval(script, 1, this.key(rule, subject), rule.windowMs) as Promise<
          [number, number]
        >,
    );

    return result && ({ hits: result[0], ttlMs: result[1] } satisfies Counter);
  }

  // Com o Redis fora do ar a requisição passa: o limite não pode derrubar o login nem a compra
  private async run<T>(command: (redis: Redis) => Promise<T>) {
    if (!this.enabled) {
      return null;
    }

    try {
      return await command(this.getConnection());
    } catch (error) {
      this.logger.warn(`Limite de requisições ignorado: ${(error as Error).message}`);
      return null;
    }
  }

  private exceeded(rule: RateLimitRule, { ttlMs }: Counter) {
    const retryAfterSeconds = Math.max(1, Math.ceil(ttlMs / 1000));

    return new TooManyRequestsError(
      `${rule.message} Tente novamente em ${formatWait(retryAfterSeconds)}.`,
      retryAfterSeconds,
    );
  }

  private key(rule: RateLimitRule, subject: string) {
    return `rate-limit:${rule.name}:${subject}`;
  }

  // Conexão própria, sem o maxRetriesPerRequest: null do BullMQ, que faria uma requisição
  // esperar para sempre por um Redis fora do ar
  private getConnection() {
    if (!this.connection) {
      this.connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
        commandTimeout: 500,
        maxRetriesPerRequest: 1,
      });
      this.connection.on('error', error =>
        this.logger.warn(`Redis do limite de requisições: ${error.message}`),
      );
    }

    return this.connection;
  }
}
