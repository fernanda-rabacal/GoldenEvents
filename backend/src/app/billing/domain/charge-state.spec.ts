import { CHARGE_TRANSITIONS, REFUND_TRANSITIONS } from './charge-state.js';
import { InvalidTransitionError } from '../../common/errors/types/invalid-transition.error.js';
import { checkTransition } from '../../../shared/state-machine.js';

describe('state machines', () => {
  it('should apply a valid charge transition', () => {
    expect(checkTransition('cobrança', CHARGE_TRANSITIONS, 'pending', 'succeeded')).toBe(
      true,
    );
  });

  it('should ignore a repeated transition', () => {
    expect(
      checkTransition('cobrança', CHARGE_TRANSITIONS, 'succeeded', 'succeeded'),
    ).toBe(false);
  });

  it.each([
    ['refunded', 'succeeded'],
    ['succeeded', 'pending'],
    ['failed', 'succeeded'],
  ] as const)('should reject a charge going from %s to %s', (from, to) => {
    expect(() => checkTransition('cobrança', CHARGE_TRANSITIONS, from, to)).toThrow(
      InvalidTransitionError,
    );
  });

  it('should accept a late payment on a cancelled charge', () => {
    expect(
      checkTransition('cobrança', CHARGE_TRANSITIONS, 'cancelled', 'succeeded'),
    ).toBe(true);
  });

  it('should only let a refund be decided once', () => {
    expect(checkTransition('estorno', REFUND_TRANSITIONS, 'pending', 'succeeded')).toBe(
      true,
    );
    expect(() =>
      checkTransition('estorno', REFUND_TRANSITIONS, 'succeeded', 'failed'),
    ).toThrow(InvalidTransitionError);
  });
});
