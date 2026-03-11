'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';

export type CollectionJobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELED';

export interface CollectionJob {
  id: string;
  nicheId: string;
  status: CollectionJobStatus;
  totalFound: number;
  totalImported: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RunAllResponse {
  totalJobs: number;
  jobs: CollectionJob[];
}

export function useCollectionJobs() {
  return useQuery({
    queryKey: ['collection-jobs'],
    queryFn: () => apiGet<CollectionJob[]>('/collection/jobs'),
    refetchInterval: (query) => {
      const data = query.state.data ?? [];
      const hasRunning = data.some((job) => job.status === 'PENDING' || job.status === 'RUNNING');
      return hasRunning ? 5000 : false;
    }
  });
}

export function useRunCollectionForNiche() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nicheId: string) => apiPost<CollectionJob>(`/collection/run/${nicheId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['collection-jobs'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      await queryClient.invalidateQueries({ queryKey: ['videos'] });
    }
  });
}

export function useRunCollectionForAll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost<RunAllResponse>('/collection/run-all'),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['collection-jobs'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      await queryClient.invalidateQueries({ queryKey: ['videos'] });
    }
  });
}
