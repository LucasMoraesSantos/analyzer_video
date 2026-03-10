import {
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { SourcePlatformCode } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ImportYoutubeVideosDto } from './dto/import-youtube-videos.dto';
import {
  VIDEO_PROVIDER_TOKEN,
  VideoProvider
} from './types/video-provider.types';
import { Inject } from '@nestjs/common';

interface ImportResultItem {
  id: string;
  externalId: string;
  title: string;
  url: string;
}

interface ImportResult {
  keyword: string;
  totalFound: number;
  totalImported: number;
  videos: ImportResultItem[];
}

@Injectable()
export class VideosService {
  constructor(
    private readonly prisma: PrismaService,
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

    const searchResults =
      await this.videoProvider.searchRecentVideosByKeyword(input.keyword);

    const details = await this.videoProvider.getVideoDetails(
      searchResults.map((item) => item.id)
    );

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
          rawPayload: normalized.rawPayload
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
          rawPayload: normalized.rawPayload
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
        url: video.url
      });
    }

    return {
      keyword: input.keyword,
      totalFound: searchResults.length,
      totalImported: importedVideos.length,
      videos: importedVideos
    };
  }
}
