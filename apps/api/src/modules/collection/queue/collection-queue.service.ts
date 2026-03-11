import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobsOptions, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { QUEUE_NAMES, QueueName } from '../constants/queue-names';
import {
  CollectVideosPayload,
  PipelineJobPayload
} from '../types/collection-job-payload.types';

@Injectable()
export class CollectionQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(CollectionQueueService.name);
  private readonly connection: IORedis;
  private readonly queues: Map<QueueName, Queue>;
  private readonly defaultAttempts: number;
  private readonly defaultBackoffMs: number;

  constructor(private readonly configService: ConfigService) {
    this.connection = new IORedis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      maxRetriesPerRequest: null
    });

    this.defaultAttempts = this.configService.get<number>('QUEUE_JOB_ATTEMPTS', 3);
    this.defaultBackoffMs = this.configService.get<number>('QUEUE_JOB_BACKOFF_MS', 1000);

    this.queues = new Map(
      Object.values(QUEUE_NAMES).map((queueName) => [
        queueName,
        new Queue(queueName, { connection: this.connection })
      ])
    );
  }

  async enqueueCollectVideos(data: CollectVideosPayload): Promise<void> {
    await this.addJob(QUEUE_NAMES.collectVideos, data.collectionJobId, data);
  }

  async enqueuePipelineJobs(data: PipelineJobPayload): Promise<void> {
    await Promise.all([
      this.addJob(QUEUE_NAMES.enrichVideos, data.collectionJobId, data),
      this.addJob(QUEUE_NAMES.analyzeTrends, data.collectionJobId, data),
      this.addJob(QUEUE_NAMES.generateSummary, data.collectionJobId, data),
      this.addJob(QUEUE_NAMES.generateScripts, data.collectionJobId, data)
    ]);
  }

  private async addJob<T>(
    queueName: QueueName,
    baseJobId: string,
    data: T,
    options?: JobsOptions
  ): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} não encontrada.`);
    }

    const jobId = `${queueName}:${baseJobId}:${Date.now()}`;

    await queue.add(queueName, data, {
      jobId,
      attempts: this.defaultAttempts,
      backoff: {
        type: 'exponential',
        delay: this.defaultBackoffMs
      },
      removeOnComplete: 100,
      removeOnFail: 200,
      ...options
    });

    this.logger.log(
      JSON.stringify({
        event: 'queue_job_enqueued',
        queueName,
        jobId,
        attempts: this.defaultAttempts,
        backoffMs: this.defaultBackoffMs
      })
    );
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(Array.from(this.queues.values()).map((queue) => queue.close()));
    await this.connection.quit();
  }
}
