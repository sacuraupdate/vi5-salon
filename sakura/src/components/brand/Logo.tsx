import { SakuraMark } from './Sakura';

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      {/* 桜紋は「少しだけ」存在感を上げる。大きくしすぎない */}
      <SakuraMark className="h-6 w-6 shrink-0 text-vermilion" />
      <span className="flex flex-col leading-none">
        <span className="font-serif text-[17px] tracking-[0.22em] text-ink sm:text-[18px]">SAKURA</span>
        {compact ? null : (
          <span className="mt-1.5 text-[9px] tracking-[0.28em] text-ink-muted">JAPAN BEAUTY</span>
        )}
      </span>
    </span>
  );
}
