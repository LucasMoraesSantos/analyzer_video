import { cn } from '@/lib/cn';

const variants = {
  EXPLODINDO: 'bg-emerald-100 text-emerald-700',
  SUBINDO: 'bg-sky-100 text-sky-700',
  ESTAVEL: 'bg-slate-100 text-slate-700',
  SATURADO: 'bg-rose-100 text-rose-700'
} as const;

export function ClassificationBadge({ value }: { value: keyof typeof variants | string }) {
  const className = variants[value as keyof typeof variants] ?? 'bg-slate-100 text-slate-700';
  return <span className={cn('rounded-full px-2 py-1 text-xs font-semibold', className)}>{value}</span>;
}
