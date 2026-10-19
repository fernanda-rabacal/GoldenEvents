import { Logger } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service.js';

const RULE = { name: 'test', limit: 1, windowMs: 60_000, message: 'Limite.' };

describe('RateLimitService', () => {
  const env = { ...process.env };
  const { warn } = Logger.prototype;
  let warnings: string[];
  let service: RateLimitService;

  beforeEach(() => {
    warnings = [];
    Logger.prototype.warn = (message: string) => warnings.push(message);
    // Porta sem Redis: toda chamada falha
    process.env.REDIS_URL = 'redis://127.0.0.1:1';
    service = new RateLimitService();
  });

  afterEach(() => {
    service.onModuleDestroy();
    process.env = { ...env };
    Logger.prototype.warn = warn;
  });

  it('should let the request through when Redis is unreachable', async () => {
    process.env.RATE_LIMIT = 'on';

    await expect(service.consume(RULE, 'ip:1')).resolves.toBeUndefined();
    await expect(service.consume(RULE, 'ip:1')).resolves.toBeUndefined();
    await expect(service.assertAllowed(RULE, 'ip:1')).resolves.toBeUndefined();
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('should not connect to Redis when disabled', async () => {
    process.env.RATE_LIMIT = 'off';

    await service.consume(RULE, 'ip:1');
    await service.recordFailure(RULE, 'ip:1');

    expect(warnings).toEqual([]);
  });
});
