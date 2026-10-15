import type { Request } from 'express';
import { assertInternalKey, clientIp } from './client-ip.js';

const KEY = 'k'.repeat(32);

function fakeRequest(headers: Record<string, string>) {
  return { ip: '10.0.0.1', get: (name: string) => headers[name] } as unknown as Request;
}

describe('clientIp', () => {
  const env = { ...process.env };

  beforeEach(() => {
    process.env.INTERNAL_API_KEY = KEY;
  });

  afterEach(() => {
    process.env = { ...env };
  });

  it('should use the IP sent by the Next.js server with the right key', () => {
    const request = fakeRequest({ 'x-internal-key': KEY, 'x-client-ip': '203.0.113.5' });

    expect(clientIp(request)).toBe('203.0.113.5');
  });

  it.each([
    ['without a key', { 'x-client-ip': '203.0.113.5' }],
    ['with a wrong key', { 'x-internal-key': 'errada', 'x-client-ip': '203.0.113.5' }],
    ['with an invalid IP', { 'x-internal-key': KEY, 'x-client-ip': 'qualquer' }],
  ])('should use the connection IP %s', (_, headers) => {
    expect(clientIp(fakeRequest(headers))).toBe('10.0.0.1');
  });

  it('should ignore the header when the API has no key', () => {
    delete process.env.INTERNAL_API_KEY;
    const request = fakeRequest({ 'x-internal-key': '', 'x-client-ip': '203.0.113.5' });

    expect(clientIp(request)).toBe('10.0.0.1');
  });
});

describe('assertInternalKey', () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it('should refuse to start in production without a long key', () => {
    process.env.NODE_ENV = 'production';
    process.env.INTERNAL_API_KEY = 'curta';

    expect(() => assertInternalKey()).toThrow('INTERNAL_API_KEY');

    process.env.INTERNAL_API_KEY = KEY;
    expect(() => assertInternalKey()).not.toThrow();
  });

  it('should not need a key outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.INTERNAL_API_KEY;

    expect(() => assertInternalKey()).not.toThrow();
  });
});
