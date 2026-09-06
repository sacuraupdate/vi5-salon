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
      className={`rounded-md border border-line bg-bg shadow-card ${
        hover ? 'transition-shadow hover:shadow-lift' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'sakura' | 'crimson' | 'outline';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-surface text-ink-muted',
    sakura: 'bg-sakura-soft text-crimson',
    crimson: 'bg-crimson text-white',
    outline: 'border border-line text-ink-muted',
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] leading-5 font-medium ${tones[tone]} ${className}`}
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
    <div className={`flex flex-col gap-2 ${alignment} ${action ? 'sm:flex-row sm:justify-between sm:items-end' : ''}`}>
      <div className={`flex flex-col gap-1.5 ${alignment}`}>
        {eyebrow ? (
          <span className="text-[11px] font-medium tracking-[0.16em] text-crimson uppercase">{eyebrow}</span>
        ) : null}
        <h2 className="text-xl sm:text-2xl">{title}</h2>
        {lead ? <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">{lead}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-sm bg-line ${className}`}>
      <div className="h-full rounded-sm bg-crimson" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
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
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-line bg-surface px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sakura-soft text-crimson">
        {icon}
      </span>
      <p className="text-base font-medium">{title}</p>
      <p className="max-w-sm text-sm leading-relaxed text-ink-muted">{body}</p>
      {action}
    </div>
  );
}
