'use client';

import { useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Card } from '@/components/ui/card';
import { VideosTable } from '@/components/videos/videos-table';
import { useDashboardNiches, useVideos } from '@/hooks/use-dashboard-data';

export default function VideosPage() {
  const [nicheId, setNicheId] = useState('');
  const niches = useDashboardNiches();

  const params = new URLSearchParams({
    page: '1',
    pageSize: '20',
    sortBy: 'trendScore',
    order: 'desc'
  });
  if (nicheId) params.set('nicheId', nicheId);

  const videos = useVideos(params.toString());

  if (niches.isLoading || videos.isLoading) return <LoadingState />;
  if (niches.isError || videos.isError) {
    return <ErrorState message={niches.error?.message ?? videos.error?.message ?? 'Erro'} />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <label className="mb-1 block text-sm font-medium">Filtro por nicho</label>
        <select
          value={nicheId}
          onChange={(event) => setNicheId(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm md:w-80"
        >
          <option value="">Todos os nichos</option>
          {(niches.data?.data ?? []).map((niche) => (
            <option key={niche.id} value={niche.id}>
              {niche.name}
            </option>
          ))}
        </select>
      </Card>

      {!videos.data || videos.data.data.length === 0 ? (
        <EmptyState title="Sem vídeos" description="Nenhum vídeo encontrado para os filtros atuais." />
      ) : (
        <VideosTable data={videos.data.data} />
      )}
    </div>
  );
}
