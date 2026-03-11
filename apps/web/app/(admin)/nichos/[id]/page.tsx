'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Card } from '@/components/ui/card';
import { VideosTable } from '@/components/videos/videos-table';
import { useDashboardNiches, useVideos } from '@/hooks/use-dashboard-data';

export default function NicheDetailPage() {
  const params = useParams<{ id: string }>();
  const nicheId = params.id;
  const niches = useDashboardNiches();
  const videos = useVideos(`nicheId=${nicheId}&page=1&pageSize=10&sortBy=trendScore&order=desc`);

  const niche = useMemo(
    () => (niches.data?.data ?? []).find((item) => item.id === nicheId),
    [niches.data?.data, nicheId]
  );

  if (niches.isLoading || videos.isLoading) return <LoadingState />;
  if (niches.isError || videos.isError) {
    return <ErrorState message={niches.error?.message ?? videos.error?.message ?? 'Erro'} />;
  }

  if (!niche) {
    return <EmptyState title="Nicho não encontrado" description="Verifique o identificador informado." />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-semibold">{niche.name}</h2>
        <p className="text-sm text-slate-500">Slug: {niche.slug}</p>
      </Card>
      {videos.data?.data.length ? (
        <VideosTable data={videos.data.data} />
      ) : (
        <EmptyState title="Sem vídeos" description="Este nicho ainda não possui vídeos analisados." />
      )}
    </div>
  );
}
