import { Injectable, Logger } from '@nestjs/common';
import { GatewayRegistry } from '../infra/gateways/gateway-registry.js';
import { WebhookEventsRepository } from '../infra/webhook-events.repository.js';
import { QUEUES, QueueService } from '../../../shared/queue/queue.service.js';

// Recebe rápido e processa depois: o controller só valida, grava e enfileira
@Injectable()
export class WebhookIngestionService {
  private readonly logger = new Logger(WebhookIngestionService.name);

  constructor(
    private readonly gateways: GatewayRegistry,
    private readonly webhookEvents: WebhookEventsRepository,
    private readonly queues: QueueService,
  ) {}

  // Devolve null para um evento repetido
  async receive(
    provider: string,
    rawBody: Buffer | undefined,
    headers: Record<string, unknown>,
  ) {
    if (!rawBody) {
      throw new Error('Corpo bruto ausente: crie o app com { rawBody: true }.');
    }

    const gateway = this.gateways.get(provider);
    const event = gateway.verifyWebhook(rawBody, headers);

    if (!event.resource) {
      return null;
    }

    // Postgres primeiro: é a fonte da verdade. A constraint única descarta a duplicata
    const id = await this.webhookEvents.insertIfAbsent({
      provider: gateway.provider,
      provider_event_id: event.id,
      type: event.type,
      payload: event.payload,
    });

    if (id) {
      await this.enqueue(id);
    }

    return id;
  }

  // Se o Redis falhar, o evento já está no banco e a varredura enfileira depois
  async enqueue(webhookEventId: string) {
    try {
      await this.queues.add(
        QUEUES.webhooks,
        'process',
        { webhookEventId },
        { jobId: webhookEventId },
      );
    } catch (error) {
      this.logger.error(
        `Webhook ${webhookEventId} não foi enfileirado: ${(error as Error).message}`,
      );
    }
  }
}
