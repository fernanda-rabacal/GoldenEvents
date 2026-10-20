import { InvalidTransitionError } from '../app/common/errors/types/invalid-transition.error.js';

export type Transitions<S extends string> = Record<S, readonly S[]>;

// false quando já está no estado: repetir uma transição é ignorado (idempotência)
export function checkTransition<S extends string>(
  entity: string,
  transitions: Transitions<S>,
  from: S,
  to: S,
) {
  if (from === to) {
    return false;
  }

  if (!transitions[from].includes(to)) {
    throw new InvalidTransitionError(entity, from, to);
  }

  return true;
}
