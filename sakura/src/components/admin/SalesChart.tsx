import { formatJpy } from '@/lib/format';
import type { DailySales } from '@/lib/data';

/**
 * 日次売上の推移。ライブラリを追加せず SVG で描く。
 * 数字の羅列にしないための最小限のグラフ。
 */
export default function SalesChart({ data }: { data: DailySales[] }) {
  const W = 720;
  const H = 180;
  const pad = { top: 12, right: 8, bottom: 22, left: 8 };
  const max = Math.max(...data.map((d) => d.jpy));
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const barW = innerW / data.length;

  const gridLines = [0.5, 1];

  return (
    <figure className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-44 w-full" role="img" aria-label="日次売上の推移">
        {gridLines.map((g) => (
          <line
            key={g}
            x1={pad.left}
            x2={W - pad.right}
            y1={pad.top + innerH * (1 - g)}
            y2={pad.top + innerH * (1 - g)}
            stroke="var(--color-line)"
            strokeWidth="1"
          />
        ))}
        {data.map((d, i) => {
          const h = (d.jpy / max) * innerH;
          const last = i === data.length - 1;
          return (
            <rect
              key={d.date}
              x={pad.left + i * barW + barW * 0.18}
              y={pad.top + innerH - h}
              width={barW * 0.64}
              height={h}
              rx="2"
              fill={last ? 'var(--color-vermilion)' : 'var(--color-sakura)'}
            />
          );
        })}
        <line
          x1={pad.left}
          x2={W - pad.right}
          y1={pad.top + innerH}
          y2={pad.top + innerH}
          stroke="var(--color-line)"
          strokeWidth="1"
        />
      </svg>
      <figcaption className="flex items-center justify-between text-[11px] text-ink-muted">
        <span>{data[0]?.date.replace(/-/g, '/')}</span>
        <span>
          最大 {formatJpy(max)} ／ 直近30日
        </span>
        <span>{data.at(-1)?.date.replace(/-/g, '/')}</span>
      </figcaption>
    </figure>
  );
}
