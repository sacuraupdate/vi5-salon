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
const toneStyles = [
  { from: '#F2EDE5', to: '#FBF9F6', accent: '#E4DCD0' },
  { from: '#EFEAE3', to: '#FAF8F4', accent: '#DED5C8' },
  { from: '#F1ECE6', to: '#FCFAF7', accent: '#E7DFD4' },
  { from: '#EDE8E0', to: '#F9F6F2', accent: '#DAD1C3' },
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
        // 人物写真が入る位置を示す、抽象化されたシルエット
        <svg
          aria-hidden
          viewBox="0 0 200 260"
          preserveAspectRatio="xMidYMax meet"
          className="absolute inset-0 h-full w-full"
        >
          {/* 背後のやわらかい光。人物の輪郭を浮かせる */}
          <ellipse cx="100" cy="126" rx="78" ry="90" fill="#FFFDFB" opacity="0.55" />
          <ellipse cx="100" cy="126" rx="78" ry="90" fill="none" stroke="var(--color-sakura)" strokeWidth="0.8" opacity="0.7" />
          {/* 墨に少し赤を混ぜた温かい影。灰色に見せない */}
          <g fill="#5A4A46" opacity="0.2">
            <ellipse cx="100" cy="104" rx="27" ry="31" />
            <rect x="89" y="124" width="22" height="42" rx="11" />
            <path d="M100 158c-38 0-68 28-68 64v38h136v-38c0-36-30-64-68-64Z" />
          </g>
          {/* 襟もと。シルエットを人物として読ませるための細い線 */}
          <path
            d="M84 172c5 9 10 14 16 14s11-5 16-14"
            fill="none"
            stroke="var(--color-bg)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.9"
          />
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
        <span className="absolute top-3 right-3 block h-4 w-4 text-gold opacity-70">
          <SakuraCrest className="h-full w-full" />
        </span>
      )}
    </div>
  );
}
