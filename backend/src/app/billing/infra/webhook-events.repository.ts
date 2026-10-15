import { Injectable } from '@nestjs/common';
import { Prisma, type PaymentProvider } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../db/prisma.service.js';

@Injectable()
export class WebhookEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Devolve null quando o provedor reenviou um evento que já foi recebido
  async insertIfAbsent(data: {
    provider: PaymentProvider;
    provider_event_id: string;
    type: string;
    payload: Record<string, unknown>;
  }) {
    const id = randomUUID();
    const { count } = await this.prisma.webhookEvent.createMany({
      data: [{ ...data, id, payload: data.payload as Prisma.InputJsonObject }],
      skipDuplicates: true,
    });

    return count === 1 ? id : null;
  }

  async findById(id: string) {
    return this.prisma.webhookEvent.findUnique({ where: { id } });
  }

  async findUnprocessedBefore(before: Date, take: number) {
    return this.prisma.webhookEvent.findMany({
      where: { processed_at: null, received_at: { lt: before } },
      orderBy: { received_at: 'asc' },
      select: { id: true },
      take,
    });
  }

  async registerAttempt(id: string) {
    await this.prisma.webhookEvent.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  async markProcessed(id: string) {
    await this.prisma.webhookEvent.update({
      where: { id },
      data: { processed_at: new Date(), last_error: null },
    });
  }

  async recordError(id: string, error: string) {
    await this.prisma.webhookEvent.update({ where: { id }, data: { last_error: error } });
  }
}
