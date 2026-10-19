import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { QUEUES, QueueService } from '../queue/queue.service.js';

export interface MaintenanceTask {
  readonly name: string;
  run(now: Date): Promise<void>;
}

const SWEEP_INTERVAL_MS = 5 * 60_000;

// Rede de segurança: cada módulo registra uma varredura que reconstrói, a partir do Postgres,
// o trabalho que deveria estar na fila
@Injectable()
export class MaintenanceService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MaintenanceService.name);
  private readonly tasks: MaintenanceTask[] = [];

  constructor(private readonly queues: QueueService) {}

  register(task: MaintenanceTask) {
    this.tasks.push(task);
  }

  async onApplicationBootstrap() {
    this.queues.process(QUEUES.maintenance, () => this.runAll());

    if (this.queues.workersEnabled) {
      await this.queues
        .queue(QUEUES.maintenance)
        .upsertJobScheduler(
          'sweep',
          { every: SWEEP_INTERVAL_MS },
          { name: 'sweep', opts: { removeOnComplete: true, removeOnFail: 100 } },
        );
    }
  }

  async runAll(now = new Date()) {
    for (const task of this.tasks) {
      try {
        await task.run(now);
      } catch (error) {
        this.logger.error(`A varredura ${task.name} falhou: ${(error as Error).message}`);
      }
    }
  }
}
