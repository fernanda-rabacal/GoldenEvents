// Fachada pública: o único arquivo de eventos que outros módulos importam
export { EventModule } from './event.module.js';
export { TicketInventoryService } from './application/ticket-inventory.service.js';
export { EVENT_CANCELLED, type EventCancelledPayload } from './domain/events.js';
