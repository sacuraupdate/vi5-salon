import { SakuraMark } from './Sakura';

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <SakuraMark className="h-6 w-6 shrink-0 text-crimson" />
      <span className="flex flex-col leading-none">
        <span className="font-serif text-[15px] tracking-[0.14em] text-ink">SAKURA</span>
        {compact ? null : (
          <span className="mt-0.5 text-[9px] tracking-[0.22em] text-ink-muted">JAPAN BEAUTY</span>
        )}
      </span>
    </span>
  );
}
