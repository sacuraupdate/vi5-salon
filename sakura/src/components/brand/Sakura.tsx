type PetalProps = {
  className?: string;
  /** 回転角（度） */
  rotate?: number;
};

/** 桜の花びら1枚。先端に切れ込みのある実際の花弁の形。 */
export function Petal({ className, rotate = 0 }: PetalProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} style={{ transform: `rotate(${rotate}deg)` }}>
      <path
        fill="currentColor"
        d="M10.6 4.8 12 6.4 13.4 4.8C16 7.6 17 9.8 17 11.8a5 5 0 0 1-10 0c0-2 1-4.2 3.6-7Z"
      />
    </svg>
  );
}

/** 5弁の桜。ロゴ周辺と証明書のみで使用する。 */
export function SakuraMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <g fill="currentColor">
        {[0, 72, 144, 216, 288].map((deg) => (
          <path
            key={deg}
            transform={`rotate(${deg} 24 24)`}
            d="M21.9 8.6 24 11l2.1-2.4c3.9 4.2 5.4 7.5 5.4 10.5a7.5 7.5 0 0 1-15 0c0-3 1.5-6.3 5.4-10.5Z"
          />
        ))}
      </g>
      <circle cx="24" cy="24" r="3.1" fill="var(--color-bg)" />
    </svg>
  );
}

/**
 * 背景にごく薄く散らす花びら。
 * CLAUDE.md 第5章のとおり「桜だらけ」にしないため、1画面につき1箇所までを原則とする。
 */
export function PetalField({ className }: { className?: string }) {
  const petals = [
    { top: '8%', left: '4%', size: 26, rotate: 18, opacity: 0.5 },
    { top: '52%', left: '11%', size: 16, rotate: -32, opacity: 0.35 },
    { top: '22%', left: '86%', size: 30, rotate: 46, opacity: 0.45 },
    { top: '70%', left: '78%', size: 18, rotate: -12, opacity: 0.3 },
    { top: '84%', left: '38%', size: 14, rotate: 70, opacity: 0.28 },
  ];
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`}>
      {petals.map((p, i) => (
        <span
          key={i}
          className="absolute block text-sakura"
          style={{ top: p.top, left: p.left, width: p.size, height: p.size, opacity: p.opacity }}
        >
          <Petal rotate={p.rotate} className="h-full w-full" />
        </span>
      ))}
    </div>
  );
}

/** セクション区切り。中央に小さく桜を置いた細い罫。 */
export function SakuraDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={`flex items-center gap-3 ${className ?? ''}`}>
      <span className="h-px flex-1 bg-line" />
      <SakuraMark className="h-3.5 w-3.5 text-sakura" />
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
