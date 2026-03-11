'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import {
  VideoHeaderCard,
  VideoMetricsCard,
  VideoScriptsCard,
  VideoSummaryCard
} from '@/components/videos/video-detail-sections';
import { useVideoDetail, useVideoScripts, useVideoSummary } from '@/hooks/use-video-detail';

export default function VideoDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const video = useVideoDetail(id);
  const summary = useVideoSummary(id);
  const scripts = useVideoScripts(id);

  if (video.isLoading || summary.isLoading || scripts.isLoading) {
    return <LoadingState />;
  }

  if (video.isError || summary.isError || scripts.isError) {
    return (
      <ErrorState
        message={
          video.error?.message ?? summary.error?.message ?? scripts.error?.message ?? 'Erro inesperado'
        }
      />
    );
  }

  if (!video.data?.data) {
    return <EmptyState title="Vídeo não encontrado" description="Não foi possível localizar este vídeo." />;
  }

  const detail = video.data.data;

  return (
    <div className="space-y-4">
      <Link href="/videos" className="inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para vídeos
      </Link>

      <VideoHeaderCard
        title={detail.title}
        thumbnailUrl={detail.thumbnailUrl}
        channelTitle={detail.channelTitle}
        publishedAt={detail.publishedAt}
        probableShort={detail.probableShort}
        trendScore={detail.trend?.trendScore ?? null}
        trendClassification={detail.trend?.trendClassification ?? null}
      />

      <VideoMetricsCard
        viewCount={detail.latestMetrics?.viewCount}
        likeCount={detail.latestMetrics?.likeCount}
        commentCount={detail.latestMetrics?.commentCount}
      />

      {summary.data?.data?.responseJson ? (
        <VideoSummaryCard responseJson={summary.data.data.responseJson} />
      ) : (
        <EmptyState
          title="Resumo indisponível"
          description="Este vídeo ainda não possui resumo estruturado gerado."
        />
      )}

      {scripts.data?.data?.length ? (
        <VideoScriptsCard scripts={scripts.data.data} />
      ) : (
        <EmptyState
          title="Roteiros indisponíveis"
          description="Este vídeo ainda não possui roteiros 30/45/60 gerados."
        />
      )}
    </div>
  );
}
