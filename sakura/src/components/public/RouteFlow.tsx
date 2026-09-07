import { ArrowRight, Award, Medal } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export type RouteStep = {
  slug: string;
  title: string;
  levelLabel: string;
  isFree: boolean;
  freeLabel: string;
  isFlagship: boolean;
};

export type RouteData = {
  id: string;
  label: string;
  desc: string;
  steps: RouteStep[];
  /** 実データから判定した終点。認定対象が無いルートで「認定へ」と出さない */
  goalKind: 'certification' | 'completion';
  goalLabel: string;
  flagshipLabel: string;
};

/**
 * 学習ルートの順路表示。最終ゴールまでを1本の流れとして見せる。
 * 診断結果とTOPのタブで同じ見た目を使う。
 */
export default function RouteFlow({ route, compact = false }: { route: RouteData; compact?: boolean }) {
  return (
    <ol className={`flex flex-col ${compact ? 'gap-2' : 'gap-3 lg:flex-row lg:items-stretch lg:gap-0'}`}>
      {route.steps.map((s, i) => (
        <li key={s.slug} className={`flex items-stretch ${compact ? '' : 'lg:flex-1'}`}>
          <Link
            href={`/courses/${s.slug}`}
            className={`group flex flex-1 flex-col gap-2 border p-4 transition-colors hover:border-navy ${
              s.isFlagship ? 'border-navy' : 'border-line'
            }`}
          >
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] tracking-[0.24em] text-ink-muted">STEP {i + 1}</span>
              {s.isFree ? (
                <span className="border border-vermilion px-1.5 text-[9px] tracking-[0.1em] text-vermilion">
                  {s.freeLabel}
                </span>
              ) : null}
              {s.isFlagship ? (
                <span className="border border-navy px-1.5 text-[9px] tracking-[0.1em] text-navy">
                  {route.flagshipLabel}
                </span>
              ) : null}
            </span>
            <span className="font-serif text-[14px] leading-relaxed text-ink">{s.title}</span>
            <span className="mt-auto text-[10px] tracking-[0.1em] text-pine">{s.levelLabel}</span>
          </Link>
          {i < route.steps.length - 1 && !compact ? (
            <span aria-hidden className="flex items-center justify-center px-1 text-line lg:px-2">
              <ArrowRight className="hidden h-4 w-4 lg:block" strokeWidth={1.25} />
            </span>
          ) : null}
        </li>
      ))}

      {/* 終点。認定対象がある場合のみ「認定へ」と表示する */}
      <li
        className={`flex items-center gap-2 border px-4 py-4 ${
          route.goalKind === 'certification'
            ? 'border-navy bg-navy text-white'
            : 'border-line text-ink-2'
        } ${compact ? '' : 'lg:ml-2 lg:flex-col lg:justify-center lg:gap-1.5 lg:px-5'}`}
      >
        {route.goalKind === 'certification' ? (
          <Medal className="h-4.5 w-4.5 shrink-0" strokeWidth={1.25} />
        ) : (
          <Award className="h-4.5 w-4.5 shrink-0 text-gold" strokeWidth={1.25} />
        )}
        <span className="text-[11px] tracking-[0.1em] whitespace-nowrap">{route.goalLabel}</span>
      </li>
    </ol>
  );
}
