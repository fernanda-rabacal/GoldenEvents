import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Job, JobsOptions, Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';

export const QUEUES = {
  webhooks: 'webhooks',
  domainEvents: 'domain-events',
  orderExpiration: 'order-expiration',
  maintenance: 'maintenance',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 8,
  backoff: { type: 'exponential', delay: 2_000 },
  removeOnComplete: { age: 24 * 3600 },
  // Falhas definitivas ficam no Redis para análise. Como o jobId é determinístico,
  // isso também impede que a varredura reenfileire em loop um job que já esgotou as tentativas
  removeOnFail: false,
};

// O Redis só guarda a fila: tudo que envolve dinheiro está no Postgres antes de virar job
@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private connection?: Redis;
  private readonly queues = new Map<QueueName, Queue>();
  private readonly workers: Worker[] = [];

  get workersEnabled() {
    return process.env.QUEUE_WORKERS !== 'off';
  }

  queue(name: QueueName) {
    let queue = this.queues.get(name);

    if (!queue) {
      queue = new Queue(name, {
        connection: this.getConnection(),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      });
      this.queues.set(name, queue);
    }

    return queue;
  }

  async add<T extends object>(
    name: QueueName,
    jobName: string,
    data: T,
    opts?: JobsOptions,
  ) {
    return this.queue(name).add(jobName, data, opts);
  }

  process<T>(
    name: QueueName,
    processor: (job: Job<T>) => Promise<unknown>,
    concurrency = 1,
  ) {
    if (!this.workersEnabled) {
      return;
    }

    const worker = new Worker<T>(name, processor, {
      connection: this.getConnection(),
      concurrency,
    });

    worker.on('failed', (job, error) => {
      this.logger.error(
        `Job ${name}/${job?.id} falhou na tentativa ${job?.attemptsMade}: ${(error as Error).message}`,
      );
    });
    worker.on('error', error =>
      this.logger.error(`Worker ${name}: ${(error as Error).message}`),
    );

    this.workers.push(worker);
  }

  async onModuleDestroy() {
    await Promise.all(this.workers.map(worker => worker.close()));
    await Promise.all([...this.queues.values()].map(queue => queue.close()));
    await this.connection?.quit();
  }

  private getConnection() {
    this.connection ??= new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });

    return this.connection;
  }
}
