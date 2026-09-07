import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  diffPercent,
  tone = 'default',
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  diffPercent?: number;
  tone?: 'default' | 'alert';
}) {
  const up = (diffPercent ?? 0) >= 0;
  return (
    <Card className={`flex flex-col gap-2 p-4 ${tone === 'alert' ? 'border-vermilion' : ''}`}>
      <div className="flex items-center justify-between">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-sm ${
            tone === 'alert' ? 'bg-vermilion text-white' : 'bg-washi text-vermilion'
          }`}
        >
          <Icon className="h-4.5 w-4.5" strokeWidth={1.5} />
        </span>
        {diffPercent != null ? (
          <span className={`inline-flex items-center gap-1 text-[11px] ${up ? 'text-vermilion' : 'text-ink-muted'}`}>
            {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            前月比 {up ? '+' : ''}
            {diffPercent}%
          </span>
        ) : null}
      </div>
      <span className="font-serif text-2xl leading-none text-ink sm:text-[26px]">{value}</span>
      <span className="text-[11px] text-ink-muted">{label}</span>
      {sub ? <span className="text-[11px] text-ink-muted">{sub}</span> : null}
    </Card>
  );
}
