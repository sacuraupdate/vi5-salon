import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

/** 項目が多い箇所を畳むためのアコーディオン（details/summary ベース）。 */
export default function Accordion({
  items,
}: {
  items: { id: string; title: string; body: ReactNode }[];
}) {
  return (
    <div className="divide-y divide-line rounded-md border border-line">
      {items.map((item) => (
        <details key={item.id} className="group px-4">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
            {item.title}
            <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-open:rotate-180" />
          </summary>
          <div className="pb-4 text-sm leading-relaxed text-ink-muted">{item.body}</div>
        </details>
      ))}
    </div>
  );
}
