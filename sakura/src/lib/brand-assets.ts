import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * ブランド素材の差し替え口。
 * public/brand/ に画像を置くだけで自動的に反映される（コード変更は不要）。
 * ファイルが無い場合は null を返し、画像なしでも成立するレイアウトにフォールバックする。
 *
 * 想定ファイル:
 *   public/brand/sakura-branch.png   桜の枝（墨絵調）
 *   public/brand/sakura-petals.png   桜の花びら
 *   public/brand/sakura-crest.png    桜紋
 *   public/brand/sakura-portrait.png SAKURA本人の写真
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

export const BRAND_FILES = {
  branch: 'sakura-branch.png',
  petals: 'sakura-petals.png',
  crest: 'sakura-crest.png',
  portrait: 'sakura-portrait.png',
} as const;
