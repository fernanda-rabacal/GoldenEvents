// Fachada pública: o único arquivo de eventos que outros módulos importam
export { EventModule } from './event.module.js';
export { TicketInventoryService } from './ticket-inventory.service.js';
export { EVENT_CANCELLED, type EventCancelledPayload } from './event.events.js';
