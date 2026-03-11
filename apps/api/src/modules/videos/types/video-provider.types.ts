export interface RawVideoSearchResult {
  id: string;
  payload: Record<string, unknown>;
}

export interface RawVideoDetailResult {
  id: string;
  payload: Record<string, unknown>;
}

export interface NormalizedVideo {
  externalId: string;
  title: string;
  description: string | null;
  publishedAt: Date | null;
  channelId: string | null;
  channelTitle: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  url: string;
  rawPayload: Record<string, unknown>;
}

export interface VideoProvider {
  readonly platform: 'YOUTUBE';
  searchRecentVideosByKeyword(keyword: string): Promise<RawVideoSearchResult[]>;
  getVideoDetails(videoIds: string[]): Promise<RawVideoDetailResult[]>;
  normalizeVideo(
    searchResult: RawVideoSearchResult,
    detailResult?: RawVideoDetailResult
  ): NormalizedVideo;
}

export const VIDEO_PROVIDER_TOKEN = 'VIDEO_PROVIDER_TOKEN';
