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
 * HERO の桜の枝。右上から入り、HERO 右側の上部〜中部へ流れ込む。
 * 「隅に置いた飾り」ではなく、HERO の構図そのものを作る要素として大きく使う。
 *
 * 重ならないことの担保:
 *   - 見出し・本文・CTA … 左端を 56% で切り落とした枠の中だけに描く（overflow-hidden）。
 *     どれだけ枝を大きくしても本文側へは1pxも出ない。
 *   - 顔・髪飾り ………… 人物写真は z-10、枝は z-0。顔の画素は不透明なので、
 *     枝は必ず人物の背面へ回り込む。頭のまわりには枝の開始位置で余白を確保している。
 */
/** 右上を最も濃く、左下（人物の頭のほう）へ向かって溶けるように消すマスク */
const MASK =
  'linear-gradient(210deg, #000 0%, #000 66%, rgba(0,0,0,0.5) 80%, transparent 94%)';

export function BrandBranch() {
  const src = brandAsset(BRAND_FILES.branch);
  if (!src) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 left-[54%] z-0 hidden select-none overflow-hidden opacity-85 lg:block"
    >
      {/* 枝の先端（左下）だけをやわらかく溶かし、クリップ端で硬く切れないようにする。
          顔は人物写真（z-10）が不透明なため、枝は必ず背面へ回り込む。 */}
      <Image
        src={src}
        alt=""
        width={2000}
        height={625}
        priority
        className="absolute top-[-8%] right-[-14%] w-[170%] max-w-[1120px] select-none"
        style={{
          maskImage: MASK,
          WebkitMaskImage: MASK,
        }}
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
