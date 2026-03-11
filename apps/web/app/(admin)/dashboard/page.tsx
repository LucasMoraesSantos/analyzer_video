'use client';

import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { TrendChart } from '@/components/dashboard/trend-chart';
import { VideosTable } from '@/components/videos/videos-table';
import {
  useDashboardNiches,
  useDashboardOverview,
  useDashboardTopTrends,
  useVideos
} from '@/hooks/use-dashboard-data';

export default function DashboardPage() {
  const overview = useDashboardOverview();
  const trends = useDashboardTopTrends();
  const niches = useDashboardNiches();
  const videos = useVideos('page=1&pageSize=8&sortBy=trendScore&order=desc');

  if (overview.isLoading || trends.isLoading || niches.isLoading || videos.isLoading) {
    return <LoadingState />;
  }

  if (overview.isError || trends.isError || niches.isError || videos.isError) {
    return (
      <ErrorState
        message={
          overview.error?.message ??
          trends.error?.message ??
          niches.error?.message ??
          videos.error?.message ??
          'Falha inesperada'
        }
      />
    );
  }

  const summary = overview.data?.data;
  const topNiches = (niches.data?.data ?? []).slice(0, 5);
  const exploding = (trends.data?.data ?? []).filter(
    (item) => item.trendClassification === 'EXPLODINDO'
  ).length;

  return (
    <div className="space-y-6">
      <KpiCards
        items={[
          { label: 'Total de nichos', value: summary?.totals.niches ?? 0 },
          { label: 'Total de vídeos analisados', value: summary?.totals.videos ?? 0 },
          { label: 'Vídeos em explosão', value: exploding },
          {
            label: 'Trend score médio',
            value: summary?.trend.averageScore?.toFixed(2) ?? '0.00'
          }
        ]}
      />

      {topNiches.length === 0 ? (
        <EmptyState title="Sem nichos" description="Não há nichos para exibir no dashboard." />
      ) : (
        <TrendChart
          data={topNiches.map((item) => ({ name: item.name, score: item.metrics.avgTrendScore }))}
        />
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Top vídeos por trend score</h2>
        {!videos.data || videos.data.data.length === 0 ? (
          <EmptyState
            title="Sem vídeos"
            description="Nenhum vídeo encontrado para os filtros atuais."
          />
        ) : (
          <VideosTable data={videos.data.data} />
        )}
      </section>
    </div>
  );
}
