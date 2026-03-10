import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CollectionJobStatus } from '@prisma/client';
import { Job, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { StructuredLoggerService } from '../../../common/logger/structured-logger.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { VideosService } from '../../videos/videos.service';
import { QUEUE_NAMES } from '../constants/queue-names';
import {
  CollectVideosPayload,
  PipelineJobPayload
} from '../types/collection-job-payload.types';
import { CollectionQueueService } from './collection-queue.service';

@Injectable()
export class CollectionWorkersService implements OnModuleInit, OnModuleDestroy {
  private readonly connection: IORedis;
  private readonly workers: Worker[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly videosService: VideosService,
    private readonly collectionQueueService: CollectionQueueService,
    private readonly logger: StructuredLoggerService
  ) {
    this.connection = new IORedis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      maxRetriesPerRequest: null
    });
  }

  onModuleInit(): void {
    this.workers.push(
      new Worker<CollectVideosPayload>(
        QUEUE_NAMES.collectVideos,
        (job) => this.processCollectVideos(job),
        { connection: this.connection, concurrency: 2 }
      )
    );

    this.workers.push(
      new Worker<PipelineJobPayload>(
        QUEUE_NAMES.enrichVideos,
        (job) => this.processPipelineStep(job, QUEUE_NAMES.enrichVideos),
        { connection: this.connection, concurrency: 4 }
      ),
      new Worker<PipelineJobPayload>(
        QUEUE_NAMES.analyzeTrends,
        (job) => this.processPipelineStep(job, QUEUE_NAMES.analyzeTrends),
        { connection: this.connection, concurrency: 4 }
      ),
      new Worker<PipelineJobPayload>(
        QUEUE_NAMES.generateSummary,
        (job) => this.processPipelineStep(job, QUEUE_NAMES.generateSummary),
        { connection: this.connection, concurrency: 4 }
      ),
      new Worker<PipelineJobPayload>(
        QUEUE_NAMES.generateScripts,
        (job) => this.processPipelineStep(job, QUEUE_NAMES.generateScripts),
        { connection: this.connection, concurrency: 4 }
      )
    );

    this.logger.log(
      {
        event: 'collection_workers_initialized',
        queues: Object.values(QUEUE_NAMES)
      },
      CollectionWorkersService.name
    );
  }

  private async processCollectVideos(job: Job<CollectVideosPayload>): Promise<void> {
    const { collectionJobId, nicheId } = job.data;

    await this.prisma.collectionJob.update({
      where: { id: collectionJobId },
      data: {
        status: CollectionJobStatus.RUNNING,
        startedAt: new Date(),
        errorMessage: null
      }
    });

    const activeKeywords = await this.prisma.keyword.findMany({
      where: { nicheId, isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    let totalFound = 0;
    let totalImported = 0;
    const errors: string[] = [];

    for (const keyword of activeKeywords) {
      try {
        const result = await this.videosService.importRecentFromYoutube({
          nicheId,
          keyword: keyword.term
        });
        totalFound += result.totalFound;
        totalImported += result.totalImported;
      } catch (error) {
        errors.push(
          `${keyword.term}: ${error instanceof Error ? error.message : String(error)}`
        );

        this.logger.warn(
          {
            event: 'keyword_collection_failed',
            collectionJobId,
            nicheId,
            keyword: keyword.term,
            error: error instanceof Error ? error.message : String(error)
          },
          CollectionWorkersService.name
        );
      }
    }

    const status =
      errors.length > 0 && totalImported === 0
        ? CollectionJobStatus.FAILED
        : CollectionJobStatus.COMPLETED;

    await this.prisma.collectionJob.update({
      where: { id: collectionJobId },
      data: {
        status,
        totalFound,
        totalImported,
        finishedAt: new Date(),
        errorMessage: errors.length > 0 ? errors.join(' | ') : null
      }
    });

    if (status === CollectionJobStatus.COMPLETED) {
      await this.collectionQueueService.enqueuePipelineJobs({ collectionJobId });
    }
  }

  private async processPipelineStep(
    job: Job<PipelineJobPayload>,
    queueName: string
  ): Promise<void> {
    this.logger.log(
      {
        event: 'pipeline_step_enqueued',
        queueName,
        collectionJobId: job.data.collectionJobId,
        bullJobId: job.id
      },
      CollectionWorkersService.name
    );
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.close()));
    await this.connection.quit();
  }
}
