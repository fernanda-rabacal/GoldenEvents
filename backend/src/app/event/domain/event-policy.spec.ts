import {
  validateEventDates,
  validateSalesWindows,
  validateSectorChanges,
} from './event-policy.js';
import { BusinessRuleError } from '../../common/errors/types/business-rule.error.js';
import { NotFoundError } from '../../common/errors/types/not-found.error.js';

const EVENT_START = new Date('2026-12-01T20:00:00Z');

function savedLot(id: number, quantity: number, quantityLeft: number) {
  return { id, name: `Lote ${id}`, quantity, quantity_left: quantityLeft };
}

describe('event policy', () => {
  it('should require the sales to end after they start and before the event', () => {
    const lot = (salesStart: Date | null, salesEnd: Date | null) => [
      { lots: [{ name: 'Lote', salesStart, salesEnd }] },
    ];

    expect(() =>
      validateSalesWindows(lot(null, new Date('2026-11-30T00:00:00Z')), EVENT_START),
    ).not.toThrow();
    expect(() =>
      validateSalesWindows(
        lot(new Date('2026-11-10T00:00:00Z'), new Date('2026-11-01T00:00:00Z')),
        EVENT_START,
      ),
    ).toThrow(BusinessRuleError);
    expect(() =>
      validateSalesWindows(lot(null, new Date('2026-12-02T00:00:00Z')), EVENT_START),
    ).toThrow(BusinessRuleError);
  });

  it('should not let the event end before it starts', () => {
    expect(() => validateEventDates(EVENT_START, undefined)).not.toThrow();
    expect(() =>
      validateEventDates(EVENT_START, new Date('2026-11-30T00:00:00Z')),
    ).toThrow(BusinessRuleError);
  });

  it('should protect the lots that already sold tickets', () => {
    const saved = [{ id: 1, lots: [savedLot(10, 100, 60), savedLot(11, 50, 50)] }];

    expect(() =>
      validateSectorChanges(saved, [{ id: 1, lots: [{ id: 10, quantity: 40 }] }]),
    ).not.toThrow();
    expect(() =>
      validateSectorChanges(saved, [{ id: 1, lots: [{ id: 10, quantity: 39 }] }]),
    ).toThrow(BusinessRuleError);
    expect(() =>
      validateSectorChanges(saved, [{ id: 1, lots: [{ id: 11, quantity: 50 }] }]),
    ).toThrow(BusinessRuleError);
    expect(() =>
      validateSectorChanges(saved, [{ id: 2, lots: [{ id: 10, quantity: 100 }] }]),
    ).toThrow(NotFoundError);
  });
});
