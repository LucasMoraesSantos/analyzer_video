import { Card } from '@/components/ui/card';

export function KpiCards({
  items
}: {
  items: Array<{ label: string; value: string | number; helper?: string }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
          {item.helper ? <p className="mt-1 text-xs text-slate-500">{item.helper}</p> : null}
        </Card>
      ))}
    </div>
  );
}
