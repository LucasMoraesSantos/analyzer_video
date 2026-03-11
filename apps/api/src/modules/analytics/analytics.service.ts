import { Injectable, NotFoundException } from '@nestjs/common';
import { AiJobStatus, Prisma, TrendClassification, TrendDirection } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ListTrendsQueryDto } from './dto/list-trends-query.dto';
import { TopListQueryDto } from './dto/top-list-query.dto';
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

  async listTrends(query: ListTrendsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.TrendAnalysisWhereInput = {
      ...(query.nicheId ? { video: { nicheId: query.nicheId } } : {}),
      ...(query.classification ? { trendClassification: query.classification } : {}),
      ...(query.direction ? { trendDirection: query.direction } : {}),
      ...(query.minTrendScore !== undefined
        ? { trendScore: { gte: query.minTrendScore } }
        : {})
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.trendAnalysis.count({ where }),
      this.prisma.trendAnalysis.findMany({
        where,
        orderBy: [{ trendScore: query.order ?? 'desc' }, { analyzedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          video: {
            select: {
              id: true,
              title: true,
              url: true,
              thumbnailUrl: true,
              niche: { select: { id: true, name: true } }
            }
          }
        }
      })
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        trendScore: Number(row.trendScore),
        trendDirection: row.trendDirection,
        trendClassification: row.trendClassification,
        analyzedAt: row.analyzedAt,
        factors: row.factorsJson,
        video: row.video
      })),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  async listClassifications() {
    const grouped = await this.prisma.trendAnalysis.groupBy({
      by: ['trendClassification'],
      _count: { _all: true }
    });

    const total = grouped.reduce((acc, item) => acc + item._count._all, 0);

    return {
      data: grouped.map((item) => ({
        classification: item.trendClassification,
        count: item._count._all,
        percentage: total > 0 ? Number(((item._count._all / total) * 100).toFixed(2)) : 0
      })),
      meta: { total }
    };
  }

  async listTopHooks(query: TopListQueryDto) {
    const summaries = await this.prisma.contentSummary.findMany({
      where: {
        status: AiJobStatus.COMPLETED,
        ...(query.nicheId ? { video: { nicheId: query.nicheId } } : {})
      },
      select: { responseJson: true }
    });

    const countMap = new Map<string, number>();
    for (const summary of summaries) {
      const hook = this.extractStringField(summary.responseJson, 'ganchoInicial');
      if (!hook) {
        continue;
      }
      countMap.set(hook, (countMap.get(hook) ?? 0) + 1);
    }

    return {
      data: [...countMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, query.limit ?? 10)
        .map(([hook, count]) => ({ hook, count }))
    };
  }

  async listTopKeywords(query: TopListQueryDto) {
    const summaries = await this.prisma.contentSummary.findMany({
      where: {
        status: AiJobStatus.COMPLETED,
        ...(query.nicheId ? { video: { nicheId: query.nicheId } } : {})
      },
      select: { responseJson: true }
    });

    const countMap = new Map<string, number>();
    for (const summary of summaries) {
      const words = this.extractKeywordArray(summary.responseJson);
      for (const word of words) {
        countMap.set(word, (countMap.get(word) ?? 0) + 1);
      }
    }

    return {
      data: [...countMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, query.limit ?? 10)
        .map(([keyword, count]) => ({ keyword, count }))
    };
  }

  private extractStringField(json: Prisma.JsonValue | null, field: string): string | null {
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
      return null;
    }

    const value = (json as Record<string, unknown>)[field];
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }

  private extractKeywordArray(json: Prisma.JsonValue | null): string[] {
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
      return [];
    }

    const value = (json as Record<string, unknown>).palavrasChave;
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim().toLowerCase());
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
