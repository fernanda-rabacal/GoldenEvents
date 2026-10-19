import { ConflictError } from './ConflictError.js';

export class InvalidTransitionError extends ConflictError {
  constructor(
    readonly entity: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Transição inválida de ${entity}: ${from} -> ${to}.`);
  }
}
