// Fachada pública: o único arquivo de cobrança que outros módulos importam
export { BillingModule } from './billing.module.js';
export {
  BillingService,
  type ChargeSummary,
  type CreateChargeInput,
  type RefundRequest,
} from './application/billing.service.js';
export {
  BILLING_EVENTS,
  type ChargeEventPayload,
  type DisputeEventPayload,
  type RefundEventPayload,
} from './domain/events.js';
