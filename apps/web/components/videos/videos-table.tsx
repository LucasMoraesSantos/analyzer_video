import Link from 'next/link';
import { ClassificationBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { VideosResponse } from '@/hooks/use-dashboard-data';

export function VideosTable({ data }: { data: VideosResponse['data'] }) {
  return (
    <Card className="overflow-hidden p-0">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3">Título</th>
            <th className="px-4 py-3">Canal</th>
            <th className="px-4 py-3">Trend Score</th>
            <th className="px-4 py-3">Classificação</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="border-t border-slate-100">
              <td className="px-4 py-3 font-medium text-slate-800">
                <Link href={`/videos?id=${row.id}`} className="hover:underline">
                  {row.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{row.channelTitle ?? '—'}</td>
              <td className="px-4 py-3">{row.trend?.trendScore ?? '—'}</td>
              <td className="px-4 py-3">
                {row.trend ? (
                  <ClassificationBadge value={row.trend.trendClassification} />
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
