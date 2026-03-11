'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet, PaginatedResponse } from '@/lib/api';

export interface DashboardOverviewResponse {
  data: {
    totals: {
      videos: number;
      probableShorts: number;
      niches: number;
      completedSummaries: number;
      completedScripts: number;
      trendAnalyses: number;
    };
    trend: {
      averageScore: number;
      lastAnalyzedAt: string | null;
    };
  };
}

export interface TopTrendItem {
  id: string;
  trendScore: number;
  trendClassification: string;
  trendDirection: string;
  analyzedAt: string;
  video: {
    id: string;
    title: string;
    url: string;
    thumbnailUrl: string | null;
    niche: { id: string; name: string };
  };
}

export interface NichesResponse {
  data: Array<{
    id: string;
    name: string;
    slug: string;
    metrics: { videos: number; keywords: number; avgTrendScore: number };
  }>;
}

export interface VideosResponse extends PaginatedResponse<{
  id: string;
  title: string;
  url: string;
  channelTitle: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  trend: {
    trendScore: number;
    trendClassification: string;
  } | null;
}> {}

export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => apiGet<DashboardOverviewResponse>('/dashboard/overview')
  });
}

export function useDashboardTopTrends() {
  return useQuery({
    queryKey: ['dashboard-top-trends'],
    queryFn: () => apiGet<{ data: TopTrendItem[] }>('/dashboard/top-trends?limit=8')
  });
}

export function useDashboardNiches() {
  return useQuery({
    queryKey: ['dashboard-niches'],
    queryFn: () => apiGet<NichesResponse>('/dashboard/niches')
  });
}

export function useVideos(params: string) {
  return useQuery({
    queryKey: ['videos', params],
    queryFn: () => apiGet<VideosResponse>(`/videos${params ? `?${params}` : ''}`)
  });
}
