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

/** 5弁の桜（塗り）。ロゴにのみ使う。 */
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
 * 桜紋（線画）。家紋のように細い線だけで描く。
 * 証明書・セクション区切りなど、格式を出したい場所に限って使う。
 */
export function SakuraCrest({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className} fill="none">
      <g stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
        {[0, 72, 144, 216, 288].map((deg) => (
          <path
            key={deg}
            transform={`rotate(${deg} 24 24)`}
            d="M22.2 9.4 24 11.4l1.8-2c3.5 3.9 4.9 6.9 4.9 9.6a6.7 6.7 0 0 1-13.4 0c0-2.7 1.4-5.7 4.9-9.6Z"
          />
        ))}
        <circle cx="24" cy="24" r="2.4" />
      </g>
    </svg>
  );
}

/**
 * 背景にごく薄く落とす桜の影。花びらは最大2枚まで。
 * 「桜だらけ」を避けるため、1画面につき1箇所までを原則とする。
 */
export function PetalShadow({ className }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`}>
      <span className="absolute top-[12%] left-[6%] block h-24 w-24 text-sakura opacity-25 sm:h-32 sm:w-32">
        <Petal rotate={22} className="h-full w-full" />
      </span>
      <span className="absolute right-[9%] bottom-[16%] block h-14 w-14 text-sakura opacity-20">
        <Petal rotate={-38} className="h-full w-full" />
      </span>
    </div>
  );
}

/** セクション区切り。細い罫の中央に小さな桜紋を置く。 */
export function SakuraDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={`flex items-center gap-4 ${className ?? ''}`}>
      <span className="h-px flex-1 bg-line" />
      <SakuraCrest className="h-3.5 w-3.5 text-gold" />
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/** 印章風のアクセント。証明書など格式を出す箇所にのみ使う。 */
export function Seal({ label, className }: { label: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-crimson text-crimson ${className ?? ''}`}
      style={{ writingMode: 'vertical-rl' }}
    >
      <span className="font-serif text-[10px] leading-tight tracking-[0.2em]">{label}</span>
    </span>
  );
}
