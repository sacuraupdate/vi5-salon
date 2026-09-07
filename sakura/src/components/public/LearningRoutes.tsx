'use client';

import { ArrowRight, Medal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link } from '@/i18n/navigation';

export type RouteStep = { slug: string; title: string; levelLabel: string; isFree: boolean; freeLabel: string };
export type RouteData = { id: string; label: string; desc: string; steps: RouteStep[] };

/**
 * 学習ルート。3ルートを縦に並べず、タブで1ルートだけ表示する。
 * 「どの順番で受ければよいか」を最短で示すためのセクション。
 */
export default function LearningRoutes({ routes }: { routes: RouteData[] }) {
  const h = useTranslations('home');
  const [active, setActive] = useState(routes[0]?.id);
  const current = routes.find((r) => r.id === active) ?? routes[0];

  return (
    <div>
      {/* タブ。モバイルでは横スクロールする */}
      <div role="tablist" className="scroller -mx-4 border-b border-line px-4 sm:mx-0 sm:px-0">
        {routes.map((r) => {
          const on = r.id === current?.id;
          return (
            <button
              key={r.id}
              role="tab"
              aria-selected={on}
              onClick={() => setActive(r.id)}
              style={{ flex: '0 0 auto' }}
              className={`min-h-12 shrink-0 border-b-2 px-4 text-[13px] whitespace-nowrap transition-colors ${
                on ? 'border-vermilion font-medium text-ink' : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {current ? (
        <div className="pt-6">
          <p className="mb-5 text-[13px] leading-loose text-ink-muted">{current.desc}</p>

          {/* 順路。横並びで矢印をつなぎ、スクロール量を増やさない */}
          <ol className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-0">
            {current.steps.map((s, i) => (
              <li key={s.slug} className="flex items-stretch lg:flex-1">
                <Link
                  href={`/courses/${s.slug}`}
                  className="group flex flex-1 flex-col gap-2 border border-line p-4 transition-colors hover:border-navy"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[9px] tracking-[0.24em] text-ink-muted">
                      {h('routeStep')} {i + 1}
                    </span>
                    {s.isFree ? (
                      <span className="border border-vermilion px-1.5 text-[9px] tracking-[0.1em] text-vermilion">
                        {s.freeLabel}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-serif text-[14px] leading-relaxed text-ink">{s.title}</span>
                  <span className="mt-auto text-[10px] tracking-[0.1em] text-pine">{s.levelLabel}</span>
                </Link>
                {i < current.steps.length - 1 ? (
                  <span aria-hidden className="flex items-center justify-center px-1 text-line lg:px-2">
                    <ArrowRight className="hidden h-4 w-4 lg:block" strokeWidth={1.25} />
                  </span>
                ) : null}
              </li>
            ))}
            <li className="flex items-center gap-2 border border-navy bg-navy px-4 py-4 text-white lg:ml-2 lg:flex-col lg:justify-center lg:gap-1.5 lg:px-5">
              <Medal className="h-4.5 w-4.5 shrink-0" strokeWidth={1.25} />
              <span className="text-[11px] tracking-[0.1em] whitespace-nowrap">{h('routeGoal')}</span>
            </li>
          </ol>
        </div>
      ) : null}
    </div>
  );
}
