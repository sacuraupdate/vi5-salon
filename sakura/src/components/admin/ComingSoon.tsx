import { Construction, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

/**
 * Phase 2 以降で実装する画面の枠。
 * 「準備中」の一文だけで終わらせず、何がここに入るのかを日本語で明示する。
 */
export default function ComingSoon({
  icon: Icon,
  title,
  description,
  features,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  features: { label: string; detail: string }[];
}) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-line text-ink-2">
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl">{title}</h1>
          <p className="text-[13px] leading-relaxed text-ink-muted">{description}</p>
        </div>
      </header>

      <Card className="flex items-center gap-3 border-line bg-washi p-4">
        <Construction className="h-5 w-5 shrink-0 text-crimson" strokeWidth={1.5} />
        <p className="text-[13px] leading-relaxed text-ink">
          この画面は Phase 2 以降で作ります。今は入る予定の機能だけをご確認ください。
        </p>
      </Card>

      <div>
        <h2 className="mb-3 text-sm text-ink-muted">ここに入る予定の機能</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((f) => (
            <Card key={f.label} className="flex flex-col gap-1.5 p-4">
              <span className="text-[14px] font-medium">{f.label}</span>
              <span className="text-[12px] leading-relaxed text-ink-muted">{f.detail}</span>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
