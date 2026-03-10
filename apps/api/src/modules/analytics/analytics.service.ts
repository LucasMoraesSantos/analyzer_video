import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TrendDirection, TrendClassification } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TrendScoreService } from './services/trend-score.service';

interface AnalyzeTrendsResult {
  collectionJobId: string;
  processedVideos: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trendScoreService: TrendScoreService
  ) {}

  async analyzeTrendsForCollectionJob(
    collectionJobId: string
  ): Promise<AnalyzeTrendsResult> {
    const collectionJob = await this.prisma.collectionJob.findUnique({
      where: { id: collectionJobId },
      include: {
        niche: {
          include: { keywords: { where: { isActive: true } } }
        }
      }
    });

    if (!collectionJob) {
      throw new NotFoundException('CollectionJob não encontrado.');
    }

    const nicheKeywords = collectionJob.niche.keywords.map((k) => k.term);

    const videos = await this.prisma.video.findMany({
      where: { nicheId: collectionJob.nicheId },
      orderBy: { updatedAt: 'desc' }
    });

    let processedVideos = 0;

    for (const video of videos) {
      await this.ensureAtLeastOneSnapshot(video.id, video.rawPayload);

      const snapshots = await this.prisma.videoMetricSnapshot.findMany({
        where: { videoId: video.id },
        orderBy: { capturedAt: 'desc' },
        take: 2
      });

      const latest = snapshots[0];
      if (!latest) {
        continue;
      }

      const result = this.trendScoreService.calculate({
        title: video.title,
        description: video.description,
        publishedAt: video.publishedAt,
        nicheKeywords,
        latestSnapshot: {
          capturedAt: latest.capturedAt,
          viewCount: latest.viewCount,
          likeCount: latest.likeCount,
          commentCount: latest.commentCount
        },
        previousSnapshot: snapshots[1]
          ? {
              capturedAt: snapshots[1].capturedAt,
              viewCount: snapshots[1].viewCount,
              likeCount: snapshots[1].likeCount,
              commentCount: snapshots[1].commentCount
            }
          : null
      });

      await this.prisma.trendAnalysis.create({
        data: {
          videoId: video.id,
          trendScore: new Prisma.Decimal(result.trendScore),
          trendDirection: result.trendDirection as TrendDirection,
          trendClassification: result.trendClassification as TrendClassification,
          heuristicVersion: 'v1.0.0',
          factorsJson: result.factors,
          analyzedAt: new Date()
        }
      });

      processedVideos += 1;
    }

    return {
      collectionJobId,
      processedVideos
    };
  }

  private async ensureAtLeastOneSnapshot(
    videoId: string,
    rawPayload: Prisma.JsonValue | null
  ): Promise<void> {
    const snapshotCount = await this.prisma.videoMetricSnapshot.count({
      where: { videoId }
    });

    if (snapshotCount > 0) {
      return;
    }

    const stats = this.extractStatsFromRawPayload(rawPayload);
    await this.prisma.videoMetricSnapshot.create({
      data: {
        videoId,
        viewCount: stats.viewCount,
        likeCount: stats.likeCount,
        commentCount: stats.commentCount,
        favoriteCount: null
      }
    });
  }

  private extractStatsFromRawPayload(rawPayload: Prisma.JsonValue | null): {
    viewCount: number | null;
    likeCount: number | null;
    commentCount: number | null;
  } {
    if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
      return { viewCount: null, likeCount: null, commentCount: null };
    }

    const root = rawPayload as {
      details?: {
        statistics?: {
          viewCount?: string;
          likeCount?: string;
          commentCount?: string;
        };
      };
    };

    return {
      viewCount: this.toNumberOrNull(root.details?.statistics?.viewCount),
      likeCount: this.toNumberOrNull(root.details?.statistics?.likeCount),
      commentCount: this.toNumberOrNull(root.details?.statistics?.commentCount)
    };
  }

  private toNumberOrNull(value: string | undefined): number | null {
    if (!value) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
