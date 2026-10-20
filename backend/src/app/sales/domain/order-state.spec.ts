import { ORDER_TRANSITIONS } from './order-state.js';
import { InvalidTransitionError } from '../../common/errors/types/invalid-transition.error.js';
import { checkTransition } from '../../../shared/state-machine.js';

describe('order state machine', () => {
  it('should deliver an expired order paid late, but never reopen a closed one', () => {
    expect(checkTransition('pedido', ORDER_TRANSITIONS, 'expired', 'paid')).toBe(true);
    expect(() =>
      checkTransition('pedido', ORDER_TRANSITIONS, 'cancelled', 'paid'),
    ).toThrow(InvalidTransitionError);
    expect(() =>
      checkTransition('pedido', ORDER_TRANSITIONS, 'refunded', 'awaiting_payment'),
    ).toThrow(InvalidTransitionError);
  });
});
