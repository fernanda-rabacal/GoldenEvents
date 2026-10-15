import type { Order } from '@golden-events/shared';
import { fetchWithAuth } from './authenticated-api';

export function getMyOrders() {
  return fetchWithAuth<Order[]>('/orders');
}
