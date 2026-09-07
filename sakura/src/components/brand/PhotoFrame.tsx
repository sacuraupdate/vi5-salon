import Image from 'next/image';
import { SakuraCrest } from './Sakura';

/**
 * 正式な写真素材が入るまでのプレースホルダ。
 * src を渡すだけで実写真に差し替わる（呼び出し側の変更は不要）。
 * 甘い印象を避けるため、桜色は使わず生成りと墨の濃淡だけで構成する。
 */
type Props = {
  src?: string | null;
  alt: string;
  /** 人物用と講座サムネイル用で構図を変える */
  kind?: 'portrait' | 'course';
  /** 講座サムネイルの濃淡バリエーション（0-3） */
  tone?: number;
  className?: string;
  priority?: boolean;
  /** アバターなど小さく使う場合は装飾を省く */
  minimal?: boolean;
};

// 生成りの濃淡。無機質な灰色にならないよう、必ず温かみのある地にする。
// 白を基調に、藍のごく淡い濃淡だけで差をつける。ピンクは使わない。
const toneStyles = [
  { from: '#EDF1F5', to: '#FDFDFE', accent: '#D3DAE2' },
  { from: '#EFF1F0', to: '#FFFFFF', accent: '#DDE3DF' },
  { from: '#F0F1F3', to: '#FDFDFD', accent: '#D9DEE4' },
  { from: '#EEF0EF', to: '#FFFFFF', accent: '#DBE0DC' },
];

export default function PhotoFrame({
  src,
  alt,
  kind = 'course',
  tone = 0,
  className = '',
  priority = false,
  minimal = false,
}: Props) {
  if (src) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 50vw" priority={priority} className="object-cover" />
      </div>
    );
  }

  const t = toneStyles[tone % toneStyles.length];

  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(165deg, ${t.from} 0%, ${t.to} 72%)` }}
    >
      {/* 和紙の質感をごく薄く重ねる */}
      <span
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
        }}
      />
      {kind === 'portrait' ? (
        // 人物写真が入る位置。人物アイコンにも制作途中にも見せないため、
        // 輪郭を持たせず「ピントの外れた気配」と細い罫だけで構図をつくる。
        <svg
          aria-hidden
          viewBox="0 0 200 260"
          preserveAspectRatio="xMidYMax meet"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            {/* 下へ向かって完全に消える。塗りの面として残さない */}
            <linearGradient id="pf-figure" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-navy)" stopOpacity="0.1" />
              <stop offset="60%" stopColor="var(--color-navy)" stopOpacity="0.05" />
              <stop offset="100%" stopColor="var(--color-navy)" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="pf-light" cx="50%" cy="38%" r="66%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
            {/* 輪郭を溶かす。丸や人型として読ませない */}
            <filter id="pf-soft" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="11" />
            </filter>
          </defs>

          {/* 背後のやわらかい光。境目のない広がりにする */}
          <rect width="200" height="260" fill="url(#pf-light)" />

          {/* 人物の気配。首でつなげた一続きの形をぼかし、記号に見せない */}
          <path
            d="M100 74c15 0 26 13 26 30 0 12-5 21-12 26 30 7 52 32 52 64v66H34v-66c0-32 22-57 52-64-7-5-12-14-12-26 0-17 11-30 26-30Z"
            fill="url(#pf-figure)"
            filter="url(#pf-soft)"
          />

          {/* 天地を示す細い罫。余白を「意図」に見せる */}
          <path d="M20 32h160" stroke="var(--color-navy)" strokeOpacity="0.14" strokeWidth="0.7" />
          <path d="M20 234h160" stroke="var(--color-navy)" strokeOpacity="0.14" strokeWidth="0.7" />
        </svg>
      ) : (
        // 講座サムネイル：直線と円弧だけの静かな構成
        <svg aria-hidden viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
          <circle cx="172" cy="14" r="48" fill={t.accent} opacity="0.7" />
          <path d="M0 104c40-6 70-30 88-70" stroke="var(--color-ink)" strokeOpacity="0.08" strokeWidth="1" fill="none" />
          <path d="M22 24h44" stroke="var(--color-ink)" strokeOpacity="0.1" strokeWidth="1" />
        </svg>
      )}

      {/* 桜は紋を1つだけ、金の細線で。散らさない。 */}
      {minimal ? null : (
        <span className="absolute top-3 right-3 block h-4 w-4 text-gold opacity-60">
          <SakuraCrest className="h-full w-full" />
        </span>
      )}
    </div>
  );
}
