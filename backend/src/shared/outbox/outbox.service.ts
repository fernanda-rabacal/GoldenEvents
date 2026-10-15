import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../db/prisma.service.js';

export type OutboxMessage<P = Record<string, any>> = {
  id: string;
  event_type: string;
  payload: P;
  processed_at: Date | null;
};

@Injectable()
export class OutboxService {
  constructor(private readonly prisma: PrismaService) {}

  // Sempre na transação da mudança de estado: nunca existe mudança sem evento, nem evento sem mudança
  async add(tx: Prisma.TransactionClient, eventType: string, payload: object) {
    await tx.outboxMessage.create({
      data: { event_type: eventType, payload: payload as Prisma.InputJsonObject },
    });
  }

  // Consumidor idempotente: true só na primeira vez que o consumidor recebe a mensagem
  async claim(tx: Prisma.TransactionClient, consumer: string, messageId: string) {
    const { count } = await tx.processedMessage.createMany({
      data: [{ consumer, message_id: messageId }],
      skipDuplicates: true,
    });

    return count === 1;
  }

  async findById(id: string) {
    return this.prisma.outboxMessage.findUnique({
      where: { id },
      select: { id: true, event_type: true, payload: true, processed_at: true },
    }) as Promise<OutboxMessage | null>;
  }

  async findUnpublished(take: number) {
    return this.prisma.outboxMessage.findMany({
      where: { published_at: null },
      orderBy: { created_at: 'asc' },
      select: { id: true, event_type: true },
      take,
    });
  }

  async findUnprocessedPublishedBefore(before: Date, take: number) {
    return this.prisma.outboxMessage.findMany({
      where: { processed_at: null, published_at: { lt: before } },
      orderBy: { created_at: 'asc' },
      select: { id: true, event_type: true },
      take,
    });
  }

  async markPublished(ids: string[]) {
    await this.prisma.outboxMessage.updateMany({
      where: { id: { in: ids }, published_at: null },
      data: { published_at: new Date() },
    });
  }

  async markProcessed(id: string) {
    await this.prisma.outboxMessage.updateMany({
      where: { id, processed_at: null },
      data: { processed_at: new Date() },
    });
  }
}
