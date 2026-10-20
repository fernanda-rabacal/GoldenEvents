import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { EventRepository, type LotQuantity } from './repositories/events.repository.js';

// Interface pública de eventos para vendas: estoque dos lotes e os dados de evento que
// vendas mostra junto dos pedidos e ingressos, sem ler nem escrever nas tabelas de eventos
@Injectable()
export class TicketInventoryService {
  constructor(private readonly repository: EventRepository) {}

  async findEvent(eventId: number) {
    return this.repository.findById(eventId);
  }

  async findEventByLotIds(lotIds: number[]) {
    return this.repository.findByLotIds(lotIds);
  }

  async findOrganizerEvents(userId: number) {
    return this.repository.findNamesByOrganizer(userId);
  }

  async findEventSummaries(eventIds: number[]) {
    return this.repository.findSummaries(eventIds);
  }

  async findLotLabels(lotIds: number[]) {
    return this.repository.findLotLabels(lotIds);
  }

  async countActiveEvents(userId: number, now: Date, createdSince?: Date) {
    return this.repository.countActiveEvents(userId, now, createdSince);
  }

  async reserve(tx: Prisma.TransactionClient, eventId: number, items: LotQuantity[]) {
    return this.repository.reserveLots(tx, eventId, items);
  }

  async release(tx: Prisma.TransactionClient, eventId: number, items: LotQuantity[]) {
    await this.repository.releaseLots(tx, eventId, items);
  }
}
