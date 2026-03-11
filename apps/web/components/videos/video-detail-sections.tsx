'use client';

import { useMemo, useState } from 'react';
import { ClassificationBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { VideoScriptItem } from '@/hooks/use-video-detail';
import { buildScriptText } from './video-detail.logic';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR');
}

function metricValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('pt-BR');
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function extractArrayStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}


export function VideoHeaderCard({
  title,
  thumbnailUrl,
  channelTitle,
  publishedAt,
  probableShort,
  trendScore,
  trendClassification
}: {
  title: string;
  thumbnailUrl: string | null;
  channelTitle: string | null;
  publishedAt: string | null;
  probableShort: boolean;
  trendScore: number | null;
  trendClassification: string | null;
}) {
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        <img
          src={thumbnailUrl ?? 'https://placehold.co/640x360?text=Sem+thumbnail'}
          alt={title}
          className="h-48 w-full rounded-lg object-cover"
        />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">Canal: {channelTitle ?? '—'}</p>
          <p className="text-sm text-slate-600">Publicado em: {formatDate(publishedAt)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {probableShort ? (
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                Provável short
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Não short
              </span>
            )}
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
              Trend score: {trendScore ?? '—'}
            </span>
            {trendClassification ? <ClassificationBadge value={trendClassification} /> : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function VideoMetricsCard({
  viewCount,
  likeCount,
  commentCount
}: {
  viewCount: number | null | undefined;
  likeCount: number | null | undefined;
  commentCount: number | null | undefined;
}) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">Métricas</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Views</p>
          <p className="text-xl font-bold">{metricValue(viewCount)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Likes</p>
          <p className="text-xl font-bold">{metricValue(likeCount)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Comentários</p>
          <p className="text-xl font-bold">{metricValue(commentCount)}</p>
        </div>
      </div>
    </Card>
  );
}

export function VideoSummaryCard({ responseJson }: { responseJson: unknown }) {
  const json = asRecord(responseJson);
  const viral = extractArrayStrings(json?.elementosVirais);

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">Resumo estruturado</h2>
      <div className="space-y-3 text-sm text-slate-700">
        <p>
          <strong>Tema central:</strong> {typeof json?.temaCentral === 'string' ? json.temaCentral : '—'}
        </p>
        <p>
          <strong>Resumo executivo:</strong>{' '}
          {typeof json?.resumoExecutivo === 'string' ? json.resumoExecutivo : '—'}
        </p>
        <p>
          <strong>Insight de recriação:</strong>{' '}
          {typeof json?.insightDeRecriacao === 'string' ? json.insightDeRecriacao : '—'}
        </p>
        <div>
          <strong>Elementos virais:</strong>
          {viral.length ? (
            <ul className="mt-1 list-disc pl-5">
              {viral.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">—</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export function VideoScriptsCard({ scripts }: { scripts: VideoScriptItem[] }) {
  const [active, setActive] = useState<'S30' | 'S45' | 'S60'>('S30');
  const [copied, setCopied] = useState<string | null>(null);

  const byDuration = useMemo(() => {
    const result: Record<string, VideoScriptItem | undefined> = {};
    for (const item of scripts) {
      result[item.duration] = item;
    }
    return result;
  }, [scripts]);

  const current = byDuration[active];
  const text = buildScriptText(current?.responseJson);

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(active);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      setCopied('erro');
      setTimeout(() => setCopied(null), 1200);
    }
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Roteiros 30/45/60</h2>
        <div className="flex gap-2">
          {(['S30', 'S45', 'S60'] as const).map((duration) => (
            <button
              key={duration}
              onClick={() => setActive(duration)}
              className={`rounded-md px-3 py-1 text-sm ${
                active === duration ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {duration.replace('S', '')}s
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <pre className="overflow-x-auto rounded-lg bg-slate-50 p-4 text-sm whitespace-pre-wrap">{text}</pre>
        <button
          onClick={copyScript}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          {copied === active ? 'Copiado!' : copied === 'erro' ? 'Falha ao copiar' : 'Copiar roteiro'}
        </button>
      </div>
    </Card>
  );
}
