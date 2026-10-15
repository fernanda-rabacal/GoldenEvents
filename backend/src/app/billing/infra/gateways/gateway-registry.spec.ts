import { GatewayRegistry } from './gateway-registry.js';
import type { PaymentGateway } from '../../domain/gateway-port.js';

describe('GatewayRegistry', () => {
  const env = { ...process.env };
  const registry = new GatewayRegistry([{ provider: 'fake' } as PaymentGateway]);

  afterEach(() => {
    process.env = { ...env };
  });

  it('should not start without a known PAYMENT_PROVIDER', () => {
    delete process.env.PAYMENT_PROVIDER;
    expect(() => registry.onModuleInit()).toThrow('PAYMENT_PROVIDER inválido ou ausente');

    process.env.PAYMENT_PROVIDER = 'desconhecido';
    expect(() => registry.onModuleInit()).toThrow('PAYMENT_PROVIDER inválido ou ausente');
  });

  it('should not start with the fake provider in production', () => {
    process.env.PAYMENT_PROVIDER = 'fake';
    process.env.NODE_ENV = 'production';

    expect(() => registry.onModuleInit()).toThrow(
      'O provedor fake não pode ser usado em produção.',
    );
  });

  it('should start with the fake provider outside production', () => {
    process.env.PAYMENT_PROVIDER = 'fake';
    process.env.NODE_ENV = 'development';

    expect(() => registry.onModuleInit()).not.toThrow();
  });
});
