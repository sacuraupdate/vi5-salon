import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-sm border border-line bg-bg ${
        hover ? 'transition-colors hover:border-ink-2' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** アイコンを収める枠。面で塗らず、細い線で囲う */
export function IconFrame({
  children,
  className = '',
  tone = 'default',
}: {
  children: ReactNode;
  className?: string;
  tone?: 'default' | 'crimson';
}) {
  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border ${
        tone === 'crimson' ? 'border-crimson text-crimson' : 'border-line text-ink-2'
      } ${className}`}
    >
      {children}
    </span>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'sakura' | 'crimson' | 'outline' | 'gold';
  className?: string;
}) {
  const tones = {
    neutral: 'border border-line text-ink-muted',
    // 桜色は細い線と文字色のみ。面では塗らない
    sakura: 'border border-sakura text-crimson',
    crimson: 'bg-crimson text-white',
    outline: 'border border-line text-ink-muted',
    gold: 'border border-gold text-gold',
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] leading-5 tracking-[0.08em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = 'left',
  action,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: 'left' | 'center';
  action?: ReactNode;
}) {
  const alignment = align === 'center' ? 'text-center items-center' : 'text-left items-start';
  return (
    <div className={`flex flex-col gap-3 ${alignment} ${action ? 'sm:flex-row sm:justify-between sm:items-end' : ''}`}>
      <div className={`flex flex-col gap-2.5 ${alignment}`}>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2 className="text-[21px] sm:text-[26px]">{title}</h2>
        {lead ? <p className="max-w-2xl text-[13px] leading-loose text-ink-muted">{lead}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`h-px w-full bg-line ${className}`} style={{ height: '2px' }}>
      <div className="h-full bg-crimson" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-sm border border-line bg-washi px-6 py-12 text-center">
      <IconFrame>{icon}</IconFrame>
      <p className="font-serif text-base text-ink">{title}</p>
      <p className="max-w-sm text-[13px] leading-loose text-ink-muted">{body}</p>
      {action}
    </div>
  );
}
