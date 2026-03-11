'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

export interface VideoDetailResponse {
  data: {
    id: string;
    externalId: string;
    title: string;
    description: string | null;
    url: string;
    thumbnailUrl: string | null;
    channelTitle: string | null;
    publishedAt: string | null;
    durationSeconds: number | null;
    probableShort: boolean;
    shortConfidence: number | null;
    trend: {
      trendScore: number;
      trendClassification: string;
      trendDirection: string;
      analyzedAt: string;
    } | null;
    latestMetrics: {
      viewCount: number | null;
      likeCount: number | null;
      commentCount: number | null;
      capturedAt: string;
    } | null;
  };
}

export interface VideoSummaryResponse {
  data: {
    id: string;
    status: string;
    generatedAt: string | null;
    responseJson: unknown;
    errorMessage: string | null;
  } | null;
}

export interface VideoScriptItem {
  id: string;
  duration: 'S30' | 'S45' | 'S60' | string;
  status: string;
  generatedAt: string | null;
  responseJson: unknown;
  errorMessage: string | null;
}

export interface VideoScriptsResponse {
  data: VideoScriptItem[];
}

export function useVideoDetail(id: string) {
  return useQuery({
    queryKey: ['video-detail', id],
    queryFn: () => apiGet<VideoDetailResponse>(`/videos/${id}`),
    enabled: Boolean(id)
  });
}

export function useVideoSummary(id: string) {
  return useQuery({
    queryKey: ['video-summary', id],
    queryFn: () => apiGet<VideoSummaryResponse>(`/videos/${id}/summary`),
    enabled: Boolean(id)
  });
}

export function useVideoScripts(id: string) {
  return useQuery({
    queryKey: ['video-scripts', id],
    queryFn: () => apiGet<VideoScriptsResponse>(`/videos/${id}/scripts`),
    enabled: Boolean(id)
  });
}
