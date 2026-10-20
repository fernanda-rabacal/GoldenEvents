import {
  FAKE_DECLINED_CARD_TOKEN,
  FAKE_SIGNATURE_HEADER,
  FakeGateway,
} from './fake.gateway.js';
import { UnauthorizedError } from '../../../common/errors/types/unauthorized.error.js';

const card = {
  amountCents: 9000,
  currency: 'BRL',
  method: 'card' as const,
  customerRef: '1',
  paymentToken: 'tok_visa',
  idempotencyKey: 'charge:order:1:1',
};

describe('FakeGateway', () => {
  let gateway: FakeGateway;

  beforeEach(() => {
    gateway = new FakeGateway();
  });

  it('should approve a card and decline the declined token', async () => {
    expect((await gateway.createCharge(card)).status).toBe('succeeded');
    expect(
      (
        await gateway.createCharge({
          ...card,
          paymentToken: FAKE_DECLINED_CARD_TOKEN,
          idempotencyKey: 'charge:order:1:2',
        })
      ).status,
    ).toBe('failed');
  });

  it('should return the same charge for the same idempotency key', async () => {
    const first = await gateway.createCharge(card);
    const retry = await gateway.createCharge(card);

    expect(retry.providerChargeId).toBe(first.providerChargeId);
  });

  it('should keep a Pix pending until it is paid', async () => {
    const { providerChargeId, status, pixQrCode } = await gateway.createCharge({
      ...card,
      method: 'pix',
    });

    expect(status).toBe('pending');
    expect(pixQrCode).toBeDefined();

    gateway.simulatePixPayment(providerChargeId);

    expect(await gateway.getCharge(providerChargeId)).toEqual({ status: 'succeeded' });
  });

  it('should refund only once per idempotency key', async () => {
    const { providerChargeId } = await gateway.createCharge(card);
    const refund = { providerChargeId, amountCents: 9000, idempotencyKey: 'refund:1' };

    const first = await gateway.refund(refund);
    const retry = await gateway.refund(refund);

    expect(retry.providerRefundId).toBe(first.providerRefundId);
    expect(await gateway.getCharge(providerChargeId)).toEqual({ status: 'refunded' });
  });

  it('should verify the webhook signature', () => {
    const { rawBody, headers } = gateway.signedWebhook(
      'charge.succeeded',
      'charge',
      'ch_1',
    );

    expect(gateway.verifyWebhook(rawBody, headers)).toEqual(
      expect.objectContaining({ resource: 'charge', resourceId: 'ch_1' }),
    );
    expect(() =>
      gateway.verifyWebhook(rawBody, { [FAKE_SIGNATURE_HEADER]: 'assinatura-falsa' }),
    ).toThrow(UnauthorizedError);
  });
});
