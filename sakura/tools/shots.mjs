/**
 * 画面確認用スクリプト（開発時のみ使用）。
 * 主要ルートを iPhone 相当・タブレット・デスクトップで開き、
 *  - 横スクロールの発生
 *  - ページ全体の高さ（不要な長スクロールの検出）
 *  - コンソールエラー
 * を記録し、スクリーンショットを保存する。
 */
import { chromium, devices } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const OUT = process.env.OUT_DIR ?? '.shots';

const viewports = {
  mobile: { ...devices['iPhone 14'] },
  tablet: { viewport: { width: 834, height: 1112 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
};

const routes = (process.env.ROUTES ?? '').split(',').filter(Boolean);
const targets = routes.length
  ? routes
  : [
      '/ja', '/ja/courses', '/ja/courses/japanese-salon-standard',
      '/ja/instructors/sakura', '/ja/instructors/tomomi', '/ja/free',
      '/ja/login', '/ja/register', '/ja/mypage', '/ja/mypage/materials',
      '/ja/mypage/certificates', '/ja/mypage/account',
      '/en', '/ko', '/zh-TW',
      '/admin', '/admin/sales', '/admin/courses', '/admin/students', '/admin/inquiries',
    ];

const only = (process.env.ONLY ?? '').split(',').filter(Boolean);
const sizes = only.length ? only : Object.keys(viewports);

await mkdir(OUT, { recursive: true });
// この実行環境に用意された Chromium を使う（追加ダウンロードはしない）
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const rows = [];

for (const size of sizes) {
  const ctx = await browser.newContext(viewports[size]);
  for (const route of targets) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    const res = await page.goto(BASE + route, { waitUntil: 'networkidle' });
    const metrics = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      scrollH: document.documentElement.scrollHeight,
      innerH: window.innerHeight,
      text: document.body.innerText.length,
      imgs: document.querySelectorAll('img,svg,[role="img"]').length,
    }));
    const name = `${size}${route.replace(/\//g, '_')}`;
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: size === 'desktop' });
    rows.push({
      size,
      route,
      status: res?.status() ?? 0,
      overflow: metrics.scrollW > metrics.clientW ? `YES(${metrics.scrollW}>${metrics.clientW})` : 'no',
      screens: (metrics.scrollH / metrics.innerH).toFixed(1),
      visuals: metrics.imgs,
      errors: errors.length ? errors.slice(0, 2).join(' | ') : '',
    });
    await page.close();
  }
  await ctx.close();
}
await browser.close();

console.table(rows);
const bad = rows.filter((r) => r.status !== 200 || r.overflow !== 'no' || r.errors);
if (bad.length) {
  console.log('\n--- 要確認 ---');
  for (const b of bad) console.log(`${b.size} ${b.route}: status=${b.status} overflow=${b.overflow} ${b.errors}`);
}
