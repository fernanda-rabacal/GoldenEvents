import {
  calculatePrice,
  checkBuyerCancellation,
  checkPurchase,
  checkRequestedItems,
  checkTicketsPerBuyer,
  NOT_ENOUGH_TICKETS,
} from './purchase-policy.js';
import { BusinessRuleError } from '../../common/errors/types/business-rule.error.js';
import { NotFoundError } from '../../common/errors/types/not-found.error.js';

const DAY_MS = 86_400_000;

function buildLot(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    price: 4500,
    quantity_left: 100,
    position: 0,
    sales_start: null,
    sales_end: null,
    ...overrides,
  };
}

function buildEvent(lots = [buildLot(), buildLot({ id: 11, price: 6000, position: 1 })]) {
  return {
    active: true,
    start_date: new Date(Date.now() + DAY_MS),
    sectors: [{ lots }],
  };
}

describe('purchase policy', () => {
  it('should price the current lot with its price in cents', () => {
    expect(checkPurchase(buildEvent(), [{ lotId: 10, quantity: 3 }])).toEqual([
      { lotId: 10, quantity: 3, unitPriceCents: 4500 },
    ]);
  });

  it.each([
    ['the previous lot sold out', { quantity_left: 0 }],
    ['the previous lot sales ended', { sales_end: new Date(Date.now() - 60_000) }],
  ])('should sell the next lot when %s', (_, previousLot) => {
    const event = buildEvent([
      buildLot(previousLot),
      buildLot({ id: 11, price: 6000, position: 1 }),
    ]);

    expect(checkPurchase(event, [{ lotId: 11, quantity: 1 }])).toEqual([
      { lotId: 11, quantity: 1, unitPriceCents: 6000 },
    ]);
  });

  it.each([
    ['a lot after the current one', buildEvent(), 11],
    [
      'a lot whose sales have not started',
      buildEvent([buildLot({ sales_start: new Date(Date.now() + DAY_MS) })]),
      10,
    ],
  ])('should not sell %s', (_, event, lotId) => {
    expect(() => checkPurchase(event, [{ lotId, quantity: 1 }])).toThrow(
      new BusinessRuleError('Este lote não está à venda.'),
    );
  });

  it('should throw a NotFoundError for a lot of another event', () => {
    expect(() => checkPurchase(buildEvent(), [{ lotId: 99, quantity: 1 }])).toThrow(
      new NotFoundError('Lote não encontrado.'),
    );
  });

  it.each([
    [
      'an event that already started',
      { start_date: new Date(Date.now() - 60_000) },
      'Não é possível comprar ingressos para um evento que já começou.',
    ],
    ['an inactive event', { active: false }, 'As vendas deste evento estão encerradas.'],
  ])('should not sell tickets for %s', (_, overrides, message) => {
    expect(() =>
      checkPurchase({ ...buildEvent(), ...overrides }, [{ lotId: 10, quantity: 1 }]),
    ).toThrow(new BusinessRuleError(message));
  });

  it('should not sell more tickets than are left in the lot', () => {
    const event = buildEvent([buildLot({ quantity_left: 2 })]);

    expect(() => checkPurchase(event, [{ lotId: 10, quantity: 3 }])).toThrow(
      new BusinessRuleError(NOT_ENOUGH_TICKETS),
    );
  });

  it('should reject the same lot twice and orders over the ticket limit', () => {
    expect(() =>
      checkRequestedItems([
        { lotId: 10, quantity: 1 },
        { lotId: 10, quantity: 1 },
      ]),
    ).toThrow(BusinessRuleError);
    expect(() =>
      checkRequestedItems([
        { lotId: 10, quantity: 6 },
        { lotId: 20, quantity: 5 },
      ]),
    ).toThrow(new BusinessRuleError('Um pedido pode ter no máximo 10 ingressos.'));
  });

  it('should sum the items into the order total', () => {
    expect(
      calculatePrice([
        { lotId: 10, quantity: 2, unitPriceCents: 4500 },
        { lotId: 20, quantity: 1, unitPriceCents: 15000 },
      ]),
    ).toEqual({ subtotalCents: 24000, discountCents: 0, totalCents: 24000 });
  });

  describe('buyer cancellation', () => {
    const upcoming = { start_date: new Date(Date.now() + 30 * DAY_MS) };

    it('should allow cancelling within 7 days of the purchase', () => {
      expect(() =>
        checkBuyerCancellation({ paid_at: new Date(Date.now() - 6 * DAY_MS) }, upcoming),
      ).not.toThrow();
    });

    it('should not allow cancelling after 7 days or after the event started', () => {
      expect(() =>
        checkBuyerCancellation({ paid_at: new Date(Date.now() - 8 * DAY_MS) }, upcoming),
      ).toThrow(BusinessRuleError);
      expect(() =>
        checkBuyerCancellation(
          { paid_at: new Date() },
          { start_date: new Date(Date.now() - 60_000) },
        ),
      ).toThrow(BusinessRuleError);
    });
  });

  describe('checkTicketsPerBuyer', () => {
    it('should allow buying up to 10 tickets per event, counting the ones already held', () => {
      expect(() => checkTicketsPerBuyer(6, [{ lotId: 10, quantity: 4 }])).not.toThrow();
      expect(() => checkTicketsPerBuyer(6, [{ lotId: 10, quantity: 5 }])).toThrow(
        'Você já tem 6.',
      );
    });
  });
});
