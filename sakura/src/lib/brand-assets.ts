import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * ブランド素材の差し替え口。
 * public/brand/ に画像を置くだけで自動的に反映される（コード変更は不要）。
 * ファイルが無い場合は null を返し、画像なしでも成立するレイアウトにフォールバックする。
 *
 * 想定ファイル:
 *   public/brand/sakura-branch.png            桜の枝（墨絵調）
 *   public/brand/sakura-petals.png            桜の花びら
 *   public/brand/sakura-crest.png             桜紋
 *   public/brand/sakura-portrait-hero.png     TOP HERO のメイン写真
 *   public/brand/sakura-portrait-about.png    SAKURA紹介・講師紹介
 *   public/brand/sakura-portrait-story.png    ブランドストーリー・経歴
 *   public/brand/sakura-portrait-welcome.png  初めての方へ・おもてなし
 *
 * サーバーコンポーネントからのみ呼ぶこと。
 */
export function brandAsset(file: string): string | null {
  try {
    return existsSync(path.join(process.cwd(), 'public', 'brand', file)) ? `/brand/${file}` : null;
  } catch {
    return null;
  }
}

/**
 * SAKURA 本人の写真は用途を固定する。
 * 1画面に何枚も並べない／写真ギャラリーにしないための取り決めであり、
 * ここに書かれた場所以外では使わないこと。
 */
export const BRAND_FILES = {
  branch: 'sakura-branch.png',
  petals: 'sakura-petals.png',
  crest: 'sakura-crest.png',
  /** TOP HERO のメイン写真（深い青緑・紫・黒・金の着物）。最優先。ここだけで使う */
  portraitHero: 'sakura-portrait-hero.png',
  /** SAKURA紹介セクション・講師紹介ページ（淡い紫の着物）。HERO には使わない */
  portraitAbout: 'sakura-portrait-about.png',
  /** ブランドストーリー・経歴（赤・黒・金の着物）。全面背景にはせず横長ビジュアルで使う */
  portraitStory: 'sakura-portrait-story.png',
  /** 初めての方へ・おもてなし（黒＋ピンクの着物）。TOPの大面積には使わない */
  portraitWelcome: 'sakura-portrait-welcome.png',
} as const;
