'use client';

import { useState, type ReactNode } from 'react';

export type TabItem = { id: string; label: string; content: ReactNode };

/** 長い内容を縦に積まないためのタブ。モバイルでは横スクロールするタブバーになる。 */
export default function Tabs({ items, initialId }: { items: TabItem[]; initialId?: string }) {
  const [active, setActive] = useState(initialId ?? items[0]?.id);
  const current = items.find((i) => i.id === active) ?? items[0];

  return (
    <div className="min-w-0">
      <div role="tablist" className="scroller -mx-4 min-w-0 border-b border-line px-4 sm:mx-0 sm:px-0">
        {items.map((item) => {
          const on = item.id === current?.id;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={on}
              onClick={() => setActive(item.id)}
              className={`min-h-11 shrink-0 border-b-2 px-3 text-sm whitespace-nowrap transition-colors ${
                on ? 'border-vermilion font-medium text-vermilion' : 'border-transparent text-ink-muted hover:text-ink'
              }`}
              style={{ flex: '0 0 auto' }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="pt-6">
        {current?.content}
      </div>
    </div>
  );
}
