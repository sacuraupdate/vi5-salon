/**
 * SAKURA 本人写真（4枚）の検査。
 *   npm run check:portraits
 *
 * 確認すること
 *   1. PNG にアルファチャンネルがあるか（本当に背景透過か）
 *   2. 四隅・外周が透明か（白・灰・黒などの背景色が焼き付いていないか）
 *   3. 人物（不透明部分）の外接矩形。上端に余白があるか＝頭頂部が詰まっていないか
 *   4. 画像の縦横比。HERO は object-contain なので切れないが、枠の比率調整の目安にする
 */
import { chromium } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'public', 'brand');
const FILES = [
  ['sakura-portrait-hero.png', 'TOP HERO'],
  ['sakura-portrait-about.png', 'SAKURA紹介・講師紹介'],
  ['sakura-portrait-story.png', 'ブランドストーリー・経歴'],
  ['sakura-portrait-welcome.png', '初めての方へ'],
];

const missing = FILES.filter(([f]) => !existsSync(path.join(DIR, f)));
if (missing.length === FILES.length) {
  console.log('写真が1枚も置かれていません。public/brand/ に4枚を置いてから実行してください。');
  process.exit(0);
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
const rows = [];

for (const [file, use] of FILES) {
  const full = path.join(DIR, file);
  if (!existsSync(full)) {
    rows.push({ ファイル: file, 用途: use, 判定: '未配置' });
    continue;
  }
  const r = await page.evaluate(async (url) => {
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    const A = (x, y) => data[(y * c.width + x) * 4 + 3];

    // 四隅の不透明度
    const corners = [
      [0, 0], [c.width - 1, 0], [0, c.height - 1], [c.width - 1, c.height - 1],
    ].map(([x, y]) => A(x, y));

    // 外周1pxの最大不透明度（背景色の焼き付き検出）
    let edgeMax = 0;
    for (let x = 0; x < c.width; x++) { edgeMax = Math.max(edgeMax, A(x, 0), A(x, c.height - 1)); }
    for (let y = 0; y < c.height; y++) { edgeMax = Math.max(edgeMax, A(0, y), A(c.width - 1, y)); }

    // 半透明を含む全体の透明率と、人物（alpha>16）の外接矩形
    let clear = 0, top = c.height, bottom = -1, left = c.width, right = -1;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const a = A(x, y);
        if (a < 8) { clear++; continue; }
        if (a > 16) {
          if (y < top) top = y;
          if (y > bottom) bottom = y;
          if (x < left) left = x;
          if (x > right) right = x;
        }
      }
    }
    return {
      w: c.width, h: c.height, corners, edgeMax,
      clearPct: Math.round((clear / (c.width * c.height)) * 100),
      top, bottom, left, right,
    };
  }, `data:image/png;base64,${readFileSync(full).toString('base64')}`);

  const 透過 = r.edgeMax === 0 ? 'OK（外周すべて完全透明）' : `要確認（外周に alpha=${r.edgeMax} の不透明画素）`;
  const 頭上余白 = `${Math.round((r.top / r.h) * 100)}%`;
  rows.push({
    ファイル: file,
    用途: use,
    サイズ: `${r.w}x${r.h}`,
    縦横比: (r.w / r.h).toFixed(2),
    透過: 透過,
    透明率: `${r.clearPct}%`,
    頭上余白: 頭上余白,
    人物範囲: `x ${r.left}-${r.right} / y ${r.top}-${r.bottom}`,
  });
}

console.table(rows);
const ng = rows.filter((x) => x.透過 && !x.透過.startsWith('OK'));
console.log(ng.length === 0 ? '\n背景透過：4枚とも問題なし' : `\n背景透過：${ng.length}枚に不透明な外周があります`);
await browser.close();
