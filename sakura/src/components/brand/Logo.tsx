import { SakuraMark } from './Sakura';

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <SakuraMark className="h-5 w-5 shrink-0 text-crimson" />
      <span className="flex flex-col leading-none">
        <span className="font-serif text-[15px] tracking-[0.2em] text-ink">SAKURA</span>
        {compact ? null : (
          <span className="mt-1 text-[8px] tracking-[0.3em] text-ink-muted">JAPAN BEAUTY</span>
        )}
      </span>
    </span>
  );
}
