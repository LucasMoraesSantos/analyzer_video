import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { request as httpsRequest } from 'node:https';
import {
  NormalizedVideo,
  RawVideoDetailResult,
  RawVideoSearchResult,
  VideoProvider
} from '../../types/video-provider.types';

interface YouTubeSearchResponse {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      channelId?: string;
      channelTitle?: string;
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
}

interface YouTubeVideosResponse {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      channelId?: string;
      channelTitle?: string;
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
    contentDetails?: {
      duration?: string;
    };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
  }>;
}

@Injectable()
export class YoutubeVideoProvider implements VideoProvider {
  readonly platform = 'YOUTUBE' as const;

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('YOUTUBE_API_KEY', '');
    this.baseUrl = this.configService.get<string>(
      'YOUTUBE_API_BASE_URL',
      'https://www.googleapis.com/youtube/v3'
    );
  }

  async searchRecentVideosByKeyword(keyword: string): Promise<RawVideoSearchResult[]> {
    const publishedAfter = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();

    const response = await this.requestWithRetry<YouTubeSearchResponse>('/search', {
      part: 'snippet',
      q: keyword,
      type: 'video',
      order: 'date',
      maxResults: '25',
      publishedAfter
    });

    const items = response.items ?? [];

    return items
      .filter((item) => Boolean(item.id?.videoId))
      .map((item) => ({
        id: item.id?.videoId ?? '',
        payload: item as Record<string, unknown>
      }));
  }

  async getVideoDetails(videoIds: string[]): Promise<RawVideoDetailResult[]> {
    if (videoIds.length === 0) {
      return [];
    }

    const uniqueIds = [...new Set(videoIds)].slice(0, 50);
    const response = await this.requestWithRetry<YouTubeVideosResponse>('/videos', {
      part: 'snippet,contentDetails,statistics',
      id: uniqueIds.join(','),
      maxResults: '50'
    });

    return (response.items ?? [])
      .filter((item) => Boolean(item.id))
      .map((item) => ({
        id: item.id ?? '',
        payload: item as Record<string, unknown>
      }));
  }

  normalizeVideo(
    searchResult: RawVideoSearchResult,
    detailResult?: RawVideoDetailResult
  ): NormalizedVideo {
    const searchPayload = searchResult.payload as YouTubeSearchResponse['items'][number];
    const detailPayload = detailResult?.payload as YouTubeVideosResponse['items'][number] | undefined;

    const snippet = detailPayload?.snippet ?? searchPayload?.snippet;

    const publishedAt = snippet?.publishedAt ? new Date(snippet.publishedAt) : null;

    return {
      externalId: searchResult.id,
      title: snippet?.title ?? '',
      description: snippet?.description ?? null,
      publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
      channelId: snippet?.channelId ?? null,
      channelTitle: snippet?.channelTitle ?? null,
      thumbnailUrl:
        snippet?.thumbnails?.high?.url ??
        snippet?.thumbnails?.medium?.url ??
        snippet?.thumbnails?.default?.url ??
        null,
      durationSeconds: this.parseDurationToSeconds(detailPayload?.contentDetails?.duration),
      viewCount: this.parseCount(detailPayload?.statistics?.viewCount),
      likeCount: this.parseCount(detailPayload?.statistics?.likeCount),
      commentCount: this.parseCount(detailPayload?.statistics?.commentCount),
      url: `https://www.youtube.com/watch?v=${searchResult.id}`,
      rawPayload: {
        search: searchResult.payload,
        details: detailResult?.payload ?? null
      }
    };
  }

  private parseDurationToSeconds(duration?: string): number | null {
    if (!duration) {
      return null;
    }

    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) {
      return null;
    }

    const hours = Number(match[1] ?? 0);
    const minutes = Number(match[2] ?? 0);
    const seconds = Number(match[3] ?? 0);
    return hours * 3600 + minutes * 60 + seconds;
  }

  private parseCount(value?: string): number | null {
    if (!value) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private async requestWithRetry<T>(
    path: string,
    params: Record<string, string>,
    retries = 3
  ): Promise<T> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('YOUTUBE_API_KEY não configurada.');
    }

    const query = new URLSearchParams({ ...params, key: this.apiKey }).toString();
    const url = `${this.baseUrl}${path}?${query}`;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt += 1) {
      try {
        const response = await this.httpGet(url);

        if (response.statusCode === 429 || (response.statusCode >= 500 && response.statusCode < 600)) {
          throw new Error(`YouTube temporary error: HTTP ${response.statusCode}`);
        }

        if (response.statusCode >= 400) {
          throw new ServiceUnavailableException(
            `YouTube API retornou erro HTTP ${response.statusCode}.`
          );
        }

        return JSON.parse(response.body) as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < retries) {
          const backoffMs = attempt * 500;
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }
      }
    }

    throw new ServiceUnavailableException(
      `Falha ao consultar YouTube API após tentativas: ${lastError?.message ?? 'erro desconhecido'}.`
    );
  }

  private httpGet(url: string): Promise<{ statusCode: number; body: string }> {
    return new Promise((resolve, reject) => {
      const req = httpsRequest(url, { method: 'GET' }, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode ?? 500, body });
        });
      });

      req.on('error', reject);
      req.end();
    });
  }
}
