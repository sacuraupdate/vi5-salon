/**
 * 多言語のレイアウト検証。
 * 4言語 × 主要3ページ × PC/スマホ で、
 *  - 横スクロール
 *  - 要素のはみ出し（親からあふれている要素）
 *  - 文字の切れ（overflow hidden で切られているテキスト）
 *  - コンソールエラー
 * を検査する。
 */
import { chromium, devices } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3100';
const locales = ['ja', 'en', 'ko', 'zh-TW'];
const paths = [
  ['', 'TOP'],
  ['/courses', '講座一覧'],
  ['/courses/japanese-salon-standard', '講座詳細'],
];
const viewports = {
  PC: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  スマホ: { ...devices['iPhone 14'] },
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const rows = [];

for (const [size, cfg] of Object.entries(viewports)) {
  const ctx = await browser.newContext(cfg);
  for (const locale of locales) {
    for (const [p, label] of paths) {
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      page.on('pageerror', (e) => errors.push(String(e)));
      const res = await page.goto(`${BASE}/${locale}${p}`, { waitUntil: 'networkidle' });

      const r = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        let overflowCount = 0;
        let clipped = 0;
        // 横スワイプ領域（overflow-x: auto/scroll）の中身は、はみ出していて正常
        // 横スワイプ領域の中身、および overflow:hidden で切り取られる装飾は正常
        const isContained = (el) => {
          let a = el.parentElement;
          while (a) {
            const cs = getComputedStyle(a);
            if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') return true;
            if (cs.overflow === 'hidden' || cs.overflowX === 'hidden') return true;
            a = a.parentElement;
          }
          return false;
        };
        const inScroller = isContained;
        document.querySelectorAll('body *').forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.right > vw + 1 && !inScroller(el)) overflowCount++;
          // 文字が入れ物からあふれて切れているもの（line-clamp は除く）
          const cs = getComputedStyle(el);
          if (
            el.children.length === 0 &&
            (el.textContent ?? '').trim().length > 0 &&
            cs.overflow !== 'visible' &&
            cs.webkitLineClamp === 'none' &&
            el.scrollWidth > el.clientWidth + 2
          ) {
            clipped++;
          }
        });
        return {
          scrollW: document.documentElement.scrollWidth,
          clientW: vw,
          overflowCount,
          clipped,
        };
      });

      rows.push({
        画面幅: size,
        言語: locale,
        ページ: label,
        状態: res?.status() ?? 0,
        横スクロール: r.scrollW > r.clientW + 1 ? `発生(${r.scrollW}>${r.clientW})` : 'なし',
        はみ出し要素: r.overflowCount,
        文字切れ: r.clipped,
        エラー: errors.length ? errors[0].slice(0, 40) : '',
      });
      await page.close();
    }
  }
  await ctx.close();
}
await browser.close();
console.table(rows);
const bad = rows.filter(
  (r) => r.状態 !== 200 || r.横スクロール !== 'なし' || r.はみ出し要素 > 0 || r.文字切れ > 0 || r.エラー,
);
console.log(bad.length ? `\n要確認 ${bad.length}件` : '\nすべて問題なし');
