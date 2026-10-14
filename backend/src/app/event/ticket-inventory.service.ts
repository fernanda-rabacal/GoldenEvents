import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { EventRepository, type LotQuantity } from './repositories/events.repository.js';

// Interface pública do estoque de lotes: vendas reserva e libera ingressos por aqui,
// sem ler nem escrever nas tabelas de eventos
@Injectable()
export class TicketInventoryService {
  constructor(private readonly repository: EventRepository) {}

  async findEvent(eventId: number) {
    return this.repository.findById(eventId);
  }

  async findEventByLotIds(lotIds: number[]) {
    return this.repository.findByLotIds(lotIds);
  }

  async reserve(tx: Prisma.TransactionClient, eventId: number, items: LotQuantity[]) {
    return this.repository.reserveLots(tx, eventId, items);
  }

  async release(tx: Prisma.TransactionClient, eventId: number, items: LotQuantity[]) {
    await this.repository.releaseLots(tx, eventId, items);
  }
}
