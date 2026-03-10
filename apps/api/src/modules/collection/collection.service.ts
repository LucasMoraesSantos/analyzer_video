import { Injectable, NotFoundException } from '@nestjs/common';
import { CollectionJob, CollectionJobStatus, SourcePlatformCode } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CollectionQueueService } from './queue/collection-queue.service';

@Injectable()
export class CollectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly collectionQueueService: CollectionQueueService
  ) {}

  async runForNiche(nicheId: string): Promise<CollectionJob> {
    const niche = await this.prisma.niche.findUnique({ where: { id: nicheId } });
    if (!niche) {
      throw new NotFoundException('Nicho não encontrado.');
    }

    const sourcePlatform = await this.prisma.sourcePlatform.upsert({
      where: { code: SourcePlatformCode.YOUTUBE },
      update: { isActive: true, name: 'YouTube' },
      create: {
        code: SourcePlatformCode.YOUTUBE,
        name: 'YouTube',
        isActive: true
      }
    });

    const collectionJob = await this.prisma.collectionJob.create({
      data: {
        sourcePlatformId: sourcePlatform.id,
        nicheId,
        status: CollectionJobStatus.PENDING
      }
    });

    await this.collectionQueueService.enqueueCollectVideos({
      collectionJobId: collectionJob.id,
      nicheId
    });

    return collectionJob;
  }

  async runAll(): Promise<{ totalJobs: number; jobs: CollectionJob[] }> {
    const niches = await this.prisma.niche.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    const jobs: CollectionJob[] = [];

    for (const niche of niches) {
      const job = await this.runForNiche(niche.id);
      jobs.push(job);
    }

    return {
      totalJobs: jobs.length,
      jobs
    };
  }

  async listJobs(): Promise<CollectionJob[]> {
    return this.prisma.collectionJob.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async getJobById(id: string): Promise<CollectionJob> {
    const job = await this.prisma.collectionJob.findUnique({ where: { id } });

    if (!job) {
      throw new NotFoundException('Job de coleta não encontrado.');
    }

    return job;
  }
}
