import { mockDeep, type DeepMockProxy } from 'jest-mock-extended';
import Stripe from 'stripe';
import { StripeGateway } from './stripe.gateway.js';
import { UnauthorizedError } from '../../../common/errors/types/unauthorized.error.js';

const card = {
  amountCents: 9000,
  currency: 'BRL',
  method: 'card' as const,
  customerRef: '1',
  paymentToken: 'ctoken_123',
  idempotencyKey: 'charge:order:1:1',
};

function intent(fields: Partial<Stripe.PaymentIntent>) {
  return {
    id: 'pi_1',
    client_secret: 'pi_1_secret',
    ...fields,
  } as Stripe.Response<Stripe.PaymentIntent>;
}

describe('StripeGateway', () => {
  let stripe: DeepMockProxy<Stripe>;
  let gateway: StripeGateway;

  beforeEach(() => {
    stripe = mockDeep<Stripe>();
    gateway = new StripeGateway(stripe);
    stripe.paymentIntents.create.mockResolvedValue(
      intent({ status: 'requires_payment_method' }),
    );
  });

  it('should create with the idempotency key and confirm with the confirmation token', async () => {
    stripe.paymentIntents.confirm.mockResolvedValue(intent({ status: 'succeeded' }));

    const result = await gateway.createCharge(card);

    expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 9000, currency: 'brl' }),
      { idempotencyKey: 'charge:order:1:1' },
    );
    expect(stripe.paymentIntents.create.mock.calls[0][0]).not.toHaveProperty(
      'payment_method_types',
    );
    expect(stripe.paymentIntents.confirm).toHaveBeenCalledWith('pi_1', {
      confirmation_token: 'ctoken_123',
    });
    expect(result).toEqual({
      providerChargeId: 'pi_1',
      status: 'succeeded',
      pixQrCode: undefined,
      clientSecret: undefined,
    });
  });

  it('should keep a card pending and return the client secret when 3D Secure is required', async () => {
    stripe.paymentIntents.confirm.mockResolvedValue(
      intent({ status: 'requires_action' }),
    );

    const result = await gateway.createCharge(card);

    expect(result.status).toBe('pending');
    expect(result.clientSecret).toBe('pi_1_secret');
  });

  it('should mark a declined card as failed', async () => {
    stripe.paymentIntents.confirm.mockRejectedValue(
      new Stripe.errors.StripeCardError({
        message: 'Your card was declined.',
        type: 'card_error',
        payment_intent: intent({
          status: 'requires_payment_method',
          last_payment_error: {
            type: 'card_error',
          } as Stripe.PaymentIntent.LastPaymentError,
        }),
      }),
    );

    expect((await gateway.createCharge(card)).status).toBe('failed');
  });

  it('should read the current state when a retry finds the intent already confirmed', async () => {
    stripe.paymentIntents.confirm.mockRejectedValue(
      new Stripe.errors.StripeInvalidRequestError({
        message: 'Unexpected state.',
        type: 'invalid_request_error',
        code: 'payment_intent_unexpected_state',
      }),
    );
    stripe.paymentIntents.retrieve.mockResolvedValue(intent({ status: 'succeeded' }));

    expect((await gateway.createCharge(card)).status).toBe('succeeded');
  });

  it('should create a Pix that expires with the order and return the copy-paste code', async () => {
    const expiresAt = new Date('2026-10-16T12:30:00Z');

    stripe.paymentIntents.confirm.mockResolvedValue(
      intent({
        status: 'requires_action',
        next_action: {
          type: 'pix_display_qr_code',
          pix_display_qr_code: { data: '00020126pix' },
        },
      }),
    );

    const result = await gateway.createCharge({
      ...card,
      method: 'pix',
      paymentToken: undefined,
      expiresAt,
    });

    expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_method_options: {
          pix: { expires_at: Math.floor(expiresAt.getTime() / 1000) },
        },
      }),
      expect.anything(),
    );
    expect(stripe.paymentIntents.confirm).toHaveBeenCalledWith('pi_1', {
      payment_method_data: { type: 'pix' },
    });
    expect(result).toMatchObject({ status: 'pending', pixQrCode: '00020126pix' });
    expect(result.clientSecret).toBeUndefined();
  });

  it('should map webhook types to resources and keep only the ids', () => {
    const event = gateway.parseWebhook({
      id: 'evt_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_1', client_secret: 'pi_1_secret' } },
    });

    expect(event).toEqual({
      id: 'evt_1',
      type: 'payment_intent.succeeded',
      resource: 'charge',
      resourceId: 'pi_1',
      payload: {
        id: 'evt_1',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_1' } },
      },
    });
    expect(gateway.parseWebhook(event.payload)).toEqual(event);
    expect(
      gateway.parseWebhook({
        id: 'evt_2',
        type: 'refund.updated',
        data: { object: { id: 're_1' } },
      }).resource,
    ).toBe('refund');
    expect(
      gateway.parseWebhook({
        id: 'evt_3',
        type: 'charge.dispute.created',
        data: { object: { id: 'dp_1' } },
      }).resource,
    ).toBe('dispute');
    expect(
      gateway.parseWebhook({
        id: 'evt_4',
        type: 'customer.created',
        data: { object: { id: 'cus_1' } },
      }).resource,
    ).toBeNull();
  });

  it('should reject a webhook with an invalid signature', () => {
    stripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Stripe.errors.StripeSignatureVerificationError('', '', {
        message: 'No signatures found.',
      });
    });

    expect(() => gateway.verifyWebhook(Buffer.from('{}'), {})).toThrow(UnauthorizedError);
  });

  it('should treat closed inquiries as won and read the PaymentIntent of a dispute', async () => {
    stripe.disputes.retrieve.mockResolvedValue({
      id: 'dp_1',
      payment_intent: 'pi_1',
      status: 'warning_closed',
      amount: 9000,
      reason: 'fraudulent',
    } as Stripe.Response<Stripe.Dispute>);

    expect(await gateway.getDispute('dp_1')).toEqual({
      providerChargeId: 'pi_1',
      status: 'won',
      amountCents: 9000,
      reason: 'fraudulent',
    });
  });

  it('should not start as the active provider without its keys', () => {
    const env = { ...process.env };

    process.env.PAYMENT_PROVIDER = 'stripe';
    delete process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_SECRET_KEY = 'rk_test_123';

    expect(() => gateway.onModuleInit()).toThrow('STRIPE_WEBHOOK_SECRET é obrigatório');

    process.env = env;
  });
});
