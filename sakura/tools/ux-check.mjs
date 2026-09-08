/**
 * UX確認基準の機械チェック。
 * クリック数・言語切替・主要導線が壊れていないかを実際のブラウザ操作で確認する。
 */
import { chromium, devices } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const results = [];
const check = (name, ok, detail = '') => results.push({ 確認項目: name, 結果: ok ? 'OK' : 'NG', 詳細: detail });

// --- デスクトップ：TOP → 講座一覧 → 講座詳細 が2クリック ---
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/ja`);
  await page.getByRole('link', { name: '講座を見る' }).first().click();
  await page.waitForURL('**/ja/courses');
  await page.locator('a[href*="/ja/courses/"]').first().click();
  await page.waitForURL(/\/ja\/courses\/[a-z-]+$/);
  check('TOPから講座詳細まで2クリック', true, page.url().replace(BASE, ''));

  // 言語切替
  await page.goto(`${BASE}/ja`);
  await page.getByRole('button', { name: '日本語' }).click();
  await page.getByRole('option', { name: 'English' }).click();
  await page.waitForURL('**/en');
  const h1 = await page.locator('h1').first().innerText();
  check('言語スイッチャーで日本語→英語', page.url().endsWith('/en'), h1.replace(/\n/g, ' '));
  await ctx.close();
}

// --- モバイル：マイページの「続きから学ぶ」が1クリック / 資料まで2クリック ---
{
  const ctx = await browser.newContext(devices['iPhone 14']);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/ja/mypage`);

  const resume = page.getByRole('link', { name: /続きを再生/ });
  const box = await resume.boundingBox();
  const vh = page.viewportSize().height;
  check('「続きから学ぶ」が1クリックで到達', (await resume.count()) === 1);
  check('「続きから学ぶ」CTAが最初の1.5画面以内', box.y < vh * 1.5, `y=${Math.round(box.y)} / 画面高=${vh}`);
  await resume.click();
  await page.waitForURL(/\/ja\/courses\//);

  await page.goto(`${BASE}/ja/mypage`);
  await page.getByRole('link', { name: '資料' }).first().click();
  await page.waitForURL('**/mypage/materials');
  const dl = await page.getByRole('button', { name: 'ダウンロード' }).count();
  check('マイページから資料まで1クリック（PDFは2クリック目）', dl > 0, `資料 ${dl}件`);
  await ctx.close();
}

// --- モバイル：講座詳細の購入CTAが常時見えている ---
{
  const ctx = await browser.newContext(devices['iPhone 14']);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/ja/courses/japanese-salon-standard`);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  // 公開準備中の講座はラベルが「公開準備中」になり押せない。
  // ここで確かめたいのは「CTAが画面下部に固定されて見えていること」なので、
  // 文言ではなく固定バー内のボタンで判定する。
  const bar = page.locator('div.fixed.inset-x-0.bottom-0');
  const cta = bar.getByRole('button').last();
  const label = (await cta.textContent())?.trim() ?? '';
  check('スマホで購入CTAが画面内に固定されている', await cta.isVisible(), label);
  await ctx.close();
}

// --- 管理画面：SAKURA と TOMOMI でメニュー数が違う ---
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/admin`);
  const ownerNav = await page.locator('aside nav a').count();
  await page.getByRole('button', { name: 'TOMOMI' }).click();
  await page.waitForTimeout(600);
  const instructorNav = await page.locator('aside nav a').count();
  check('TOMOMI画面がSAKURAより簡単', instructorNav < ownerNav, `SAKURA ${ownerNav}項目 → TOMOMI ${instructorNav}項目`);

  // 管理画面に英語ラベルが出ていないか（固有名詞と Certificate ID を除く）
  await page.goto(`${BASE}/admin`);
  const words = await page.evaluate(() => {
    // 固有名詞・ブランド表記・製品名は英語のままでよい
    const allow = /^(SAKURA|TOMOMI|JAPAN|BEAUTY|Phase|ID|AI|PDF|Workbook|Certificate|SJB-[0-9-]+)$/;
    const skipTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);
    const found = new Set();
    document.querySelectorAll('body *').forEach((el) => {
      if (skipTags.has(el.tagName) || el.closest('nextjs-portal')) return;
      if (el.children.length) return;
      for (const w of (el.textContent ?? '').match(/[A-Za-z][A-Za-z-]{2,}/g) ?? []) {
        if (!allow.test(w)) found.add(w);
      }
    });
    return [...found];
  });
  check('管理画面に不要な英語ラベルがない', words.length === 0, words.join(', ') || 'なし');
  await ctx.close();
}

await browser.close();
console.table(results);
const ng = results.filter((r) => r.結果 === 'NG');
if (ng.length) process.exitCode = 1;
