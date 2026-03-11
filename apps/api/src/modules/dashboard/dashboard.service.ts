import { Injectable } from '@nestjs/common';
import { AiJobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [totalVideos, probableShorts, completedSummaries, completedScripts, totalNiches] =
      await this.prisma.$transaction([
        this.prisma.video.count(),
        this.prisma.video.count({ where: { isProbableShort: true } }),
        this.prisma.contentSummary.count({ where: { status: AiJobStatus.COMPLETED } }),
        this.prisma.scriptGeneration.count({ where: { status: AiJobStatus.COMPLETED } }),
        this.prisma.niche.count({ where: { isActive: true } })
      ]);

    const trendAgg = await this.prisma.trendAnalysis.aggregate({
      _avg: { trendScore: true },
      _max: { analyzedAt: true },
      _count: { _all: true }
    });

    return {
      data: {
        totals: {
          videos: totalVideos,
          probableShorts,
          niches: totalNiches,
          completedSummaries,
          completedScripts,
          trendAnalyses: trendAgg._count._all
        },
        trend: {
          averageScore: Number(trendAgg._avg.trendScore ?? 0),
          lastAnalyzedAt: trendAgg._max.analyzedAt
        }
      }
    };
  }

  async getTopTrends(input: { nicheId?: string; limit?: number }) {
    const where: Prisma.TrendAnalysisWhereInput = input.nicheId
      ? { video: { nicheId: input.nicheId } }
      : {};

    const rows = await this.prisma.trendAnalysis.findMany({
      where,
      orderBy: [{ trendScore: 'desc' }, { analyzedAt: 'desc' }],
      take: input.limit ?? 10,
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
    });

    return {
      data: rows.map((row) => ({
        id: row.id,
        trendScore: Number(row.trendScore),
        trendClassification: row.trendClassification,
        trendDirection: row.trendDirection,
        analyzedAt: row.analyzedAt,
        video: row.video
      }))
    };
  }

  async getNiches() {
    const niches = await this.prisma.niche.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            videos: true,
            keywords: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const trendByNiche = await this.prisma.trendAnalysis.groupBy({
      by: ['videoId'],
      _max: { trendScore: true }
    });

    const videoIds = trendByNiche.map((item) => item.videoId);
    const videos = videoIds.length
      ? await this.prisma.video.findMany({
          where: { id: { in: videoIds } },
          select: { id: true, nicheId: true }
        })
      : [];

    const nicheScoreMap = new Map<string, number[]>();
    const videoNiche = new Map(videos.map((v) => [v.id, v.nicheId]));

    for (const item of trendByNiche) {
      const nicheId = videoNiche.get(item.videoId);
      if (!nicheId || !item._max.trendScore) {
        continue;
      }
      const list = nicheScoreMap.get(nicheId) ?? [];
      list.push(Number(item._max.trendScore));
      nicheScoreMap.set(nicheId, list);
    }

    return {
      data: niches.map((niche) => {
        const scores = nicheScoreMap.get(niche.id) ?? [];
        const avgTrendScore =
          scores.length > 0
            ? scores.reduce((acc, item) => acc + item, 0) / scores.length
            : 0;

        return {
          id: niche.id,
          name: niche.name,
          slug: niche.slug,
          metrics: {
            videos: niche._count.videos,
            keywords: niche._count.keywords,
            avgTrendScore: Number(avgTrendScore.toFixed(2))
          }
        };
      })
    };
  }
}
