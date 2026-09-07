'use client';

import { useState } from 'react';
import RouteFlow, { type RouteData } from './RouteFlow';

/**
 * 学習ルート。3ルートを縦に並べず、タブで1ルートだけ表示する。
 */
export default function LearningRoutes({ routes }: { routes: RouteData[] }) {
  const [active, setActive] = useState(routes[0]?.id);
  const current = routes.find((r) => r.id === active) ?? routes[0];

  return (
    <div>
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
          <RouteFlow route={current} />
        </div>
      ) : null}
    </div>
  );
}
