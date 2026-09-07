import Image from 'next/image';
import { brandAsset, BRAND_FILES } from '@/lib/brand-assets';
import { Petal, SakuraCrest } from './Sakura';

/**
 * ブランド素材の表示。public/brand/ に画像があればそれを使い、
 * 無ければ線画（SVG）へ自動的にフォールバックする。
 * どちらの場合もレイアウトは崩れない。
 * サーバーコンポーネント専用（ファイルの有無をサーバーで判定するため）。
 */

/** 桜紋。ロゴ補助・見出し・証明書など小さなブランド紋として使う */
export function BrandCrest({ className = '' }: { className?: string }) {
  const src = brandAsset(BRAND_FILES.crest);
  if (!src) return <SakuraCrest className={className} />;
  return (
    <span className={`relative inline-block ${className}`}>
      <Image src={src} alt="" aria-hidden fill sizes="48px" className="object-contain" />
    </span>
  );
}

/**
 * HERO の桜の枝。右上から入り、SAKURA の背面へ流れる。
 * 人物写真は背景透過のため、枝は写真越しに透けて見える。
 * 顔・髪飾りに重ねすぎないよう、
 *   - 左端を 58% で切り落として本文側・人物の中心側へ出さない
 *   - 枝の主要部を右上の隅へ寄せ、人物へ向かうのは細い先端だけにする
 *   - 濃度を落として「背面の気配」に留める
 * の3点で抑えている（枠は overflow-hidden）。
 */
export function BrandBranch() {
  const src = brandAsset(BRAND_FILES.branch);
  if (!src) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 left-[58%] z-0 hidden select-none overflow-hidden opacity-70 lg:block"
    >
      <Image
        src={src}
        alt=""
        width={2000}
        height={625}
        priority
        className="absolute -top-[16%] -right-[24%] w-[112%] max-w-[560px] select-none"
      />
    </div>
  );
}

/**
 * 桜の花びら。TOP全体には散らさず、2〜3箇所だけに薄く置く。
 * 画像が無いときは線画の花びらを1枚だけ出す。
 */
export function BrandPetals({
  className = '',
  opacity = 0.5,
  rotate = 0,
  assetOnly = false,
}: {
  className?: string;
  opacity?: number;
  /** 同じ向きの花びらを並べないための回転角（度） */
  rotate?: number;
  /**
   * true のとき、正式な桜素材が無ければ何も描かない。
   * 線画フォールバックは桜色なので、桜色を増やしたくない箇所（HERO）で使う。
   */
  assetOnly?: boolean;
}) {
  const src = brandAsset(BRAND_FILES.petals);
  if (!src) {
    if (assetOnly) return null;
    return (
      <span aria-hidden className={`pointer-events-none absolute block text-sakura ${className}`} style={{ opacity }}>
        <Petal rotate={18 + rotate} className="h-full w-full" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute block ${className}`}
      style={{ opacity, transform: rotate ? `rotate(${rotate}deg)` : undefined }}
    >
      <Image src={src} alt="" fill sizes="240px" className="object-contain select-none" />
    </span>
  );
}
