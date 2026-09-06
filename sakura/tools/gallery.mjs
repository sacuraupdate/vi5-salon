/**
 * 画面確認用のスクリーンショット一括取得（開発時のみ）。
 * `npm run start -- -p 3100` で本番ビルドを起動した状態で実行する。
 *   OUT=<出力先> node tools/gallery.mjs
 * 主要8画面（TOP / 講座一覧 / 講座詳細 / SAKURA / TOMOMI / マイページ / 管理×2）を
 * デスクトップとスマホでフルページ保存する。
 */
import { chromium, devices } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const BASE = 'http://localhost:3100';
const OUT = process.env.OUT;
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

// デスクトップ（フルページ）
const shots = [
  ['/ja', 'top'],
  ['/ja/courses', 'courses'],
  ['/ja/courses/japanese-salon-standard', 'course-detail'],
  ['/ja/instructors/sakura', 'sakura'],
  ['/ja/instructors/tomomi', 'tomomi'],
  ['/ja/mypage', 'mypage'],
];
const dctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
for (const [route, name] of shots) {
  const p = await dctx.newPage();
  await p.goto(BASE + route, { waitUntil: 'networkidle' });
  await p.screenshot({ path: `${OUT}/pc-${name}.png`, fullPage: true });
  await p.close();
}
// 管理画面 SAKURA（owner）
{
  const p = await dctx.newPage();
  await p.goto(BASE + '/admin', { waitUntil: 'networkidle' });
  await p.screenshot({ path: `${OUT}/pc-admin-sakura.png`, fullPage: true });
  await p.close();
}
// 管理画面 TOMOMI（instructor cookie）
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([{ name: 'sjb_admin_role', value: 'instructor', url: BASE }]);
  const p = await ctx.newPage();
  await p.goto(BASE + '/admin', { waitUntil: 'networkidle' });
  await p.screenshot({ path: `${OUT}/pc-admin-tomomi.png`, fullPage: true });
  await ctx.close();
}
await dctx.close();

// モバイル（iPhone、フルページ）
const mctx = await b.newContext(devices['iPhone 14']);
for (const [route, name] of shots) {
  const p = await mctx.newPage();
  await p.goto(BASE + route, { waitUntil: 'networkidle' });
  await p.screenshot({ path: `${OUT}/sp-${name}.png`, fullPage: true });
  await p.close();
}
await mctx.close();
await b.close();
console.log('done');
