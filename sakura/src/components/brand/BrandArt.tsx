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
 * HERO の桜の枝。右上から入り、見出しや人物には重ねない（背面に置く）。
 * 白背景の余白を残すため、幅は抑えめにする。
 */
export function BrandBranch() {
  const src = brandAsset(BRAND_FILES.branch);
  if (!src) return null;
  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      width={2000}
      height={625}
      priority
      className="pointer-events-none absolute top-0 right-0 z-0 hidden w-[52%] max-w-[680px] select-none lg:block"
    />
  );
}

/**
 * 桜の花びら。TOP全体には散らさず、2〜3箇所だけに薄く置く。
 * 画像が無いときは線画の花びらを1枚だけ出す。
 */
export function BrandPetals({
  className = '',
  opacity = 0.5,
}: {
  className?: string;
  opacity?: number;
}) {
  const src = brandAsset(BRAND_FILES.petals);
  if (!src) {
    return (
      <span aria-hidden className={`pointer-events-none absolute block text-sakura ${className}`} style={{ opacity }}>
        <Petal rotate={18} className="h-full w-full" />
      </span>
    );
  }
  return (
    <span aria-hidden className={`pointer-events-none absolute block ${className}`} style={{ opacity }}>
      <Image src={src} alt="" fill sizes="240px" className="object-contain select-none" />
    </span>
  );
}
