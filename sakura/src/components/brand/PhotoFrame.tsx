import Image from 'next/image';
import { Petal, SakuraMark } from './Sakura';

/**
 * 正式な写真素材が入るまでのプレースホルダ。
 * src を渡すだけで実写真に差し替わる（呼び出し側の変更は不要）。
 * 素材が無くてもブランドの意図が伝わるよう、桜のブランド装飾で構成している。
 */
type Props = {
  src?: string | null;
  alt: string;
  /** 人物用と講座サムネイル用で構図を変える */
  kind?: 'portrait' | 'course';
  /** 講座サムネイルの配色バリエーション（0-3） */
  tone?: number;
  className?: string;
  priority?: boolean;
  /** アバターなど小さく使う場合は装飾を省く */
  minimal?: boolean;
};

const toneStyles = [
  { from: '#FAEFF2', to: '#FFFFFF', accent: '#F1D9DF' },
  { from: '#FAF8F5', to: '#FFFFFF', accent: '#E9E3E1' },
  { from: '#F7F1F2', to: '#FDFBFA', accent: '#EBD5DA' },
  { from: '#FBF6F2', to: '#FFFFFF', accent: '#EFE0D9' },
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
      style={{ background: `linear-gradient(160deg, ${t.from} 0%, ${t.to} 68%)` }}
    >
      {/* やわらかい光の面 */}
      <div
        aria-hidden
        className="absolute -top-1/4 left-1/2 h-[120%] w-[80%] -translate-x-1/2 rounded-full opacity-60"
        style={{ background: `radial-gradient(closest-side, #FFFFFF 0%, transparent 100%)` }}
      />

      {kind === 'portrait' ? (
        // 人物写真が入る位置を示す、抽象化されたシルエット（頭・首・肩をつなげて1つの形にする）
        <svg
          aria-hidden
          viewBox="0 0 200 260"
          preserveAspectRatio="xMidYMax meet"
          className="absolute inset-0 h-full w-full"
        >
          <ellipse cx="100" cy="132" rx="70" ry="82" fill="#FFFFFF" opacity="0.45" />
          <g fill="var(--color-crimson)" opacity="0.11">
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
            opacity="0.85"
          />
        </svg>
      ) : (
        <svg aria-hidden viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
          <circle cx="168" cy="18" r="52" fill={t.accent} opacity="0.85" />
          <circle cx="150" cy="96" r="22" fill={t.accent} opacity="0.5" />
          <path d="M0 108c34-10 58-30 74-58" stroke="var(--color-crimson)" strokeOpacity="0.12" strokeWidth="1.5" fill="none" />
        </svg>
      )}

      {/* 桜のワンポイント（画面あたりの使用量を抑えるため小さく1〜2枚だけ） */}
      {minimal ? null : (
        <>
          <span className="absolute top-4 right-4 block h-5 w-5 text-sakura opacity-80">
            <Petal rotate={24} className="h-full w-full" />
          </span>
          {kind === 'portrait' ? (
            <span className="absolute bottom-5 left-5 block h-6 w-6 text-sakura opacity-60">
              <SakuraMark className="h-full w-full" />
            </span>
          ) : null}
        </>
      )}
    </div>
  );
}
