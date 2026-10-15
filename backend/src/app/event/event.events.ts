// Emitido quando um evento que ainda não começou é desativado: vendas estorna os pedidos
export const EVENT_CANCELLED = 'events.event_cancelled';

export type EventCancelledPayload = { eventId: number };
