import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { OutboxService, type OutboxMessage } from '../outbox/outbox.service.js';
import { QUEUES, QueueService } from '../queue/queue.service.js';

export interface DomainEventConsumer {
  readonly name: string;
  readonly eventTypes: readonly string[];
  // Pode receber a mesma mensagem mais de uma vez: precisa ser idempotente
  handle(message: OutboxMessage): Promise<void>;
}

const PUBLISH_BATCH = 100;

// Entrega os eventos do outbox: um relay publica as linhas novas na fila domain-events,
// e o worker chama cada consumidor interessado. Quem emite não sabe quem escuta
@Injectable()
export class DomainEventBus implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(DomainEventBus.name);
  private readonly consumers: DomainEventConsumer[] = [];
  private timer?: NodeJS.Timeout;
  private publishing = false;

  constructor(
    private readonly outbox: OutboxService,
    private readonly queues: QueueService,
  ) {}

  register(consumer: DomainEventConsumer) {
    this.consumers.push(consumer);
  }

  onApplicationBootstrap() {
    this.queues.process<{ messageId: string }>(
      QUEUES.domainEvents,
      job => this.deliver(job.data.messageId),
      5,
    );

    if (this.queues.workersEnabled) {
      this.timer = setInterval(
        () => void this.publishPending(),
        Number(process.env.OUTBOX_POLL_INTERVAL_MS ?? 500),
      );
    }
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }

  async publishPending() {
    if (this.publishing) {
      return;
    }

    this.publishing = true;

    try {
      const messages = await this.outbox.findUnpublished(PUBLISH_BATCH);

      if (messages.length > 0) {
        await this.enqueue(messages);
        await this.outbox.markPublished(messages.map(({ id }) => id));
      }
    } catch (error) {
      this.logger.error(`Falha ao publicar o outbox: ${(error as Error).message}`);
    } finally {
      this.publishing = false;
    }
  }

  // Varredura: mensagens publicadas que nunca terminaram, por exemplo porque o Redis perdeu a fila
  async republishUnprocessed(publishedBefore: Date) {
    const messages = await this.outbox.findUnprocessedPublishedBefore(
      publishedBefore,
      500,
    );

    if (messages.length > 0) {
      await this.enqueue(messages);
    }
  }

  async deliver(messageId: string) {
    const message = await this.outbox.findById(messageId);

    if (!message || message.processed_at) {
      return;
    }

    for (const consumer of this.consumers) {
      if (consumer.eventTypes.includes(message.event_type)) {
        await consumer.handle(message);
      }
    }

    await this.outbox.markProcessed(message.id);
  }

  // jobId = id da mensagem: enfileirar de novo algo que ainda está na fila não tem efeito
  private async enqueue(messages: { id: string; event_type: string }[]) {
    await this.queues.queue(QUEUES.domainEvents).addBulk(
      messages.map(({ id, event_type }) => ({
        name: event_type,
        data: { messageId: id },
        opts: { jobId: id },
      })),
    );
  }
}
