'use client';

import Link from 'next/link';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Card } from '@/components/ui/card';
import { useDashboardNiches } from '@/hooks/use-dashboard-data';

export default function NichosPage() {
  const query = useDashboardNiches();

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message={query.error.message} />;

  const niches = query.data?.data ?? [];
  if (niches.length === 0) {
    return <EmptyState title="Sem nichos" description="Cadastre ou ative nichos para iniciar a análise." />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {niches.map((niche) => (
        <Link key={niche.id} href={`/nichos/${niche.id}`}>
          <Card className="hover:border-slate-300">
            <h2 className="font-semibold">{niche.name}</h2>
            <p className="text-sm text-slate-500">Slug: {niche.slug}</p>
            <p className="mt-3 text-sm">Vídeos: {niche.metrics.videos}</p>
            <p className="text-sm">Keywords: {niche.metrics.keywords}</p>
            <p className="text-sm">Trend médio: {niche.metrics.avgTrendScore}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
