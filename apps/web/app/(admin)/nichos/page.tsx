'use client';

import Link from 'next/link';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Card } from '@/components/ui/card';
import {
  CollectionJobStatus,
  useCollectionJobs,
  useRunCollectionForAll,
  useRunCollectionForNiche
} from '@/hooks/use-collection';
import { useDashboardNiches } from '@/hooks/use-dashboard-data';

function statusLabel(status: CollectionJobStatus): string {
  const labels: Record<CollectionJobStatus, string> = {
    PENDING: 'Pendente',
    RUNNING: 'Processando',
    COMPLETED: 'Concluído',
    FAILED: 'Falhou',
    CANCELED: 'Cancelado'
  };
  return labels[status];
}

function statusClass(status: CollectionJobStatus): string {
  const classes: Record<CollectionJobStatus, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    RUNNING: 'bg-sky-100 text-sky-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    FAILED: 'bg-rose-100 text-rose-700',
    CANCELED: 'bg-slate-200 text-slate-700'
  };

  return classes[status];
}

export default function NichosPage() {
  const nichesQuery = useDashboardNiches();
  const jobsQuery = useCollectionJobs();
  const runNiche = useRunCollectionForNiche();
  const runAll = useRunCollectionForAll();

  if (nichesQuery.isLoading || jobsQuery.isLoading) return <LoadingState />;
  if (nichesQuery.isError || jobsQuery.isError) {
    return <ErrorState message={nichesQuery.error?.message ?? jobsQuery.error?.message ?? 'Erro'} />;
  }

  const niches = nichesQuery.data?.data ?? [];
  if (niches.length === 0) {
    return <EmptyState title="Sem nichos" description="Cadastre ou ative nichos para iniciar a análise." />;
  }

  const jobs = jobsQuery.data ?? [];
  const latestByNiche = new Map<string, (typeof jobs)[number]>();
  for (const job of jobs) {
    if (!latestByNiche.has(job.nicheId)) {
      latestByNiche.set(job.nicheId, job);
    }
  }

  const hasRunning = jobs.some((job) => job.status === 'PENDING' || job.status === 'RUNNING');

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Operações de coleta</h2>
            <p className="text-sm text-slate-500">
              Dispare coleta por nicho ou para todos os nichos ativos.
            </p>
          </div>
          <button
            onClick={() => runAll.mutate()}
            disabled={runAll.isPending || runNiche.isPending || hasRunning}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {runAll.isPending ? 'Disparando...' : 'Rodar coleta de todos os nichos'}
          </button>
        </div>

        {runAll.isSuccess ? (
          <p className="mt-3 text-sm text-emerald-700">Coleta em lote disparada com sucesso.</p>
        ) : null}
        {runAll.isError ? (
          <p className="mt-3 text-sm text-rose-700">{runAll.error.message}</p>
        ) : null}
        {hasRunning ? (
          <p className="mt-3 text-sm text-sky-700">Há jobs em processamento. Status atualizado automaticamente.</p>
        ) : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {niches.map((niche) => {
          const latestJob = latestByNiche.get(niche.id);
          const isBusy = latestJob?.status === 'PENDING' || latestJob?.status === 'RUNNING';
          const isSubmittingThisNiche = runNiche.isPending && runNiche.variables === niche.id;

          return (
            <Card key={niche.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/nichos/${niche.id}`} className="font-semibold hover:underline">
                    {niche.name}
                  </Link>
                  <p className="text-sm text-slate-500">Slug: {niche.slug}</p>
                </div>
                {latestJob ? (
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(latestJob.status)}`}>
                    {statusLabel(latestJob.status)}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">Sem job</span>
                )}
              </div>

              <div className="text-sm">
                <p>Vídeos: {niche.metrics.videos}</p>
                <p>Keywords: {niche.metrics.keywords}</p>
                <p>Trend médio: {niche.metrics.avgTrendScore}</p>
              </div>

              <button
                onClick={() => runNiche.mutate(niche.id)}
                disabled={runNiche.isPending || runAll.isPending || isBusy}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingThisNiche ? 'Disparando...' : isBusy ? 'Coleta em andamento' : 'Rodar coleta deste nicho'}
              </button>

              {latestJob?.status === 'FAILED' && latestJob.errorMessage ? (
                <p className="text-xs text-rose-700">Falha: {latestJob.errorMessage}</p>
              ) : null}
            </Card>
          );
        })}
      </div>

      {runNiche.isSuccess ? (
        <p className="text-sm text-emerald-700">Coleta do nicho disparada com sucesso.</p>
      ) : null}
      {runNiche.isError ? <p className="text-sm text-rose-700">{runNiche.error.message}</p> : null}
    </div>
  );
}
