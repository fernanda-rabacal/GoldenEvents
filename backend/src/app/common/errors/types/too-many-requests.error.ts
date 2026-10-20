import { DomainError } from './domain.error.js';

export class TooManyRequestsError extends DomainError {
  constructor(
    message: string,
    readonly retryAfterSeconds: number,
  ) {
    super(message);
  }
}
