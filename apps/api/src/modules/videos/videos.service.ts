import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, SourcePlatformCode } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ImportYoutubeVideosDto } from './dto/import-youtube-videos.dto';
import { ListVideosQueryDto } from './dto/list-videos-query.dto';
import { ShortClassifierService } from './services/short-classifier.service';
import {
  VIDEO_PROVIDER_TOKEN,
  VideoProvider
} from './types/video-provider.types';

interface ImportResultItem {
  id: string;
  externalId: string;
  title: string;
  url: string;
  probableShort: boolean;
  shortConfidence: number;
}

interface ImportResult {
  keyword: string;
  totalFound: number;
  totalImported: number;
  videos: ImportResultItem[];
}

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly shortClassifierService: ShortClassifierService,
    @Inject(VIDEO_PROVIDER_TOKEN)
    private readonly videoProvider: VideoProvider
  ) {}

  async importRecentFromYoutube(input: ImportYoutubeVideosDto): Promise<ImportResult> {
    const niche = await this.prisma.niche.findUnique({ where: { id: input.nicheId } });

    if (!niche) {
      throw new NotFoundException('Nicho informado não encontrado.');
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

    let searchResults: Awaited<ReturnType<VideoProvider['searchRecentVideosByKeyword']>> = [];

    try {
      searchResults = await this.videoProvider.searchRecentVideosByKeyword(input.keyword);
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: 'youtube_search_fallback_empty',
          nicheId: input.nicheId,
          keyword: input.keyword,
          error: error instanceof Error ? error.message : String(error)
        })
      );

      return {
        keyword: input.keyword,
        totalFound: 0,
        totalImported: 0,
        videos: []
      };
    }

    let details: Awaited<ReturnType<VideoProvider['getVideoDetails']>> = [];

    try {
      details = await this.videoProvider.getVideoDetails(searchResults.map((item) => item.id));
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: 'youtube_details_fallback_metadata_only',
          nicheId: input.nicheId,
          keyword: input.keyword,
          error: error instanceof Error ? error.message : String(error)
        })
      );
    }

    const detailsMap = new Map(details.map((item) => [item.id, item]));

    const importedVideos: ImportResultItem[] = [];

    for (const searchResult of searchResults) {
      const normalized = this.videoProvider.normalizeVideo(
        searchResult,
        detailsMap.get(searchResult.id)
      );

      if (!normalized.externalId || !normalized.title) {
        continue;
      }

      const shortClassification = this.shortClassifierService.classify({
        durationSeconds: normalized.durationSeconds,
        title: normalized.title,
        description: normalized.description
      });

      const video = await this.prisma.video.upsert({
        where: {
          sourcePlatformId_externalId: {
            sourcePlatformId: sourcePlatform.id,
            externalId: normalized.externalId
          }
        },
        update: {
          nicheId: input.nicheId,
          title: normalized.title,
          description: normalized.description,
          publishedAt: normalized.publishedAt,
          channelId: normalized.channelId,
          channelTitle: normalized.channelTitle,
          thumbnailUrl: normalized.thumbnailUrl,
          durationSeconds: normalized.durationSeconds,
          url: normalized.url,
          rawPayload: normalized.rawPayload,
          isProbableShort: shortClassification.probableShort,
          shortConfidence: shortClassification.shortConfidence
        },
        create: {
          sourcePlatformId: sourcePlatform.id,
          nicheId: input.nicheId,
          externalId: normalized.externalId,
          title: normalized.title,
          description: normalized.description,
          publishedAt: normalized.publishedAt,
          channelId: normalized.channelId,
          channelTitle: normalized.channelTitle,
          thumbnailUrl: normalized.thumbnailUrl,
          durationSeconds: normalized.durationSeconds,
          url: normalized.url,
          rawPayload: normalized.rawPayload,
          isProbableShort: shortClassification.probableShort,
          shortConfidence: shortClassification.shortConfidence
        }
      });

      await this.prisma.videoMetricSnapshot.create({
        data: {
          videoId: video.id,
          viewCount: normalized.viewCount,
          likeCount: normalized.likeCount,
          commentCount: normalized.commentCount,
          favoriteCount: null
        }
      });

      importedVideos.push({
        id: video.id,
        externalId: video.externalId,
        title: video.title,
        url: video.url,
        probableShort: video.isProbableShort,
        shortConfidence: video.shortConfidence ?? 0
      });
    }

    return {
      keyword: input.keyword,
      totalFound: searchResults.length,
      totalImported: importedVideos.length,
      videos: importedVideos
    };
  }

  async list(query: ListVideosQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.VideoWhereInput = {
      ...(query.nicheId ? { nicheId: query.nicheId } : {}),
      ...(query.probableShort !== undefined
        ? { isProbableShort: query.probableShort }
        : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { channelTitle: { contains: query.search, mode: 'insensitive' } }
            ]
          }
        : {}),
      ...(query.minTrendScore !== undefined
        ? {
            trendAnalyses: {
              some: {
                trendScore: { gte: query.minTrendScore }
              }
            }
          }
        : {})
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.video.count({ where }),
      this.prisma.video.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy:
          query.sortBy === 'publishedAt'
            ? { publishedAt: query.order ?? 'desc' }
            : { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          url: true,
          thumbnailUrl: true,
          channelTitle: true,
          publishedAt: true,
          isProbableShort: true,
          shortConfidence: true,
          niche: { select: { id: true, name: true } },
          trendAnalyses: {
            orderBy: [{ analyzedAt: 'desc' }],
            take: 1,
            select: {
              trendScore: true,
              trendClassification: true,
              trendDirection: true,
              analyzedAt: true
            }
          }
        }
      })
    ]);

    const data = rows
      .map((row) => {
        const trend = row.trendAnalyses[0] ?? null;
        if (query.minTrendScore !== undefined && trend && Number(trend.trendScore) < query.minTrendScore) {
          return null;
        }

        return {
          id: row.id,
          title: row.title,
          url: row.url,
          thumbnailUrl: row.thumbnailUrl,
          channelTitle: row.channelTitle,
          publishedAt: row.publishedAt,
          probableShort: row.isProbableShort,
          shortConfidence: row.shortConfidence,
          niche: row.niche,
          trend: trend
            ? {
                trendScore: Number(trend.trendScore),
                trendClassification: trend.trendClassification,
                trendDirection: trend.trendDirection,
                analyzedAt: trend.analyzedAt
              }
            : null
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (query.sortBy === 'trendScore') {
      data.sort((a, b) => {
        const av = a.trend?.trendScore ?? -1;
        const bv = b.trend?.trendScore ?? -1;
        return (query.order ?? 'desc') === 'asc' ? av - bv : bv - av;
      });
    }

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  async getById(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      select: {
        id: true,
        externalId: true,
        title: true,
        description: true,
        url: true,
        thumbnailUrl: true,
        channelTitle: true,
        publishedAt: true,
        durationSeconds: true,
        isProbableShort: true,
        shortConfidence: true,
        niche: { select: { id: true, name: true } },
        trendAnalyses: {
          orderBy: [{ analyzedAt: 'desc' }],
          take: 1,
          select: {
            trendScore: true,
            trendClassification: true,
            trendDirection: true,
            analyzedAt: true
          }
        },
        metricSnapshots: {
          orderBy: [{ capturedAt: 'desc' }],
          take: 1,
          select: {
            viewCount: true,
            likeCount: true,
            commentCount: true,
            capturedAt: true
          }
        }
      }
    });

    if (!video) {
      throw new NotFoundException('Vídeo não encontrado.');
    }

    return {
      data: {
        ...video,
        probableShort: video.isProbableShort,
        trend: video.trendAnalyses[0]
          ? {
              trendScore: Number(video.trendAnalyses[0].trendScore),
              trendClassification: video.trendAnalyses[0].trendClassification,
              trendDirection: video.trendAnalyses[0].trendDirection,
              analyzedAt: video.trendAnalyses[0].analyzedAt
            }
          : null,
        latestMetrics: video.metricSnapshots[0] ?? null
      }
    };
  }

  async getLatestSummary(videoId: string) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId }, select: { id: true } });
    if (!video) {
      throw new NotFoundException('Vídeo não encontrado.');
    }

    const summary = await this.prisma.contentSummary.findFirst({
      where: { videoId },
      orderBy: [{ generatedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        status: true,
        generatedAt: true,
        responseJson: true,
        errorMessage: true
      }
    });

    return { data: summary };
  }

  async getScripts(videoId: string) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId }, select: { id: true } });
    if (!video) {
      throw new NotFoundException('Vídeo não encontrado.');
    }

    const scripts = await this.prisma.scriptGeneration.findMany({
      where: { videoId },
      orderBy: [{ createdAt: 'desc' }, { duration: 'asc' }],
      select: {
        id: true,
        duration: true,
        status: true,
        generatedAt: true,
        responseJson: true,
        errorMessage: true
      }
    });

    return { data: scripts };
  }
}
