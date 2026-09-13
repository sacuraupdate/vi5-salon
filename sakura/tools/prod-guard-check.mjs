/**
 * 本番相当（確認用フラグなし）で、購入者向け画面と管理画面が閉じていることを確認する。
 *
 * 使い方：
 *   npm run build
 *   npx next start -p 3100      ← SITE_DEMO_MODE / ADMIN_DEMO_MODE を設定しないこと
 *   BASE_URL=http://localhost:3100 npm run prod-guard-check
 *
 * 注意：HTML を grep して判定しないこと。
 * 4言語ぶんの翻訳文がクライアント用データとしてHTMLに埋め込まれるため、
 * 画面に出ていない文言でも grep には引っかかる。必ず描画結果（innerText / URL）で判定する。
 */
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3100';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const results = [];
const check = (name, ok, detail = '') =>
  results.push({ 確認項目: name, 結果: ok ? 'OK' : 'NG', 詳細: String(detail).slice(0, 70) });

// Cookie を偽造した状態で試す（認証が未実装のため、Cookie だけで入れてはいけない）
const ctx = await browser.newContext();
await ctx.addCookies([
  { name: 'sjb_session', value: 'demo', url: BASE },
  { name: 'sjb_admin_role', value: 'owner', url: BASE },
]);
const page = await ctx.newPage();

for (const path of ['/en/mypage', '/en/mypage/materials', '/en/learn/japanese-salon-standard']) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  check(`Cookie を偽造しても ${path} に入れない`, /\/login/.test(page.url()), page.url().replace(BASE, ''));
}

await page.goto(`${BASE}/en/login`, { waitUntil: 'networkidle' });
const login = await page.locator('main').innerText();
check('ログイン画面に確認用セッションのボタンが出ない', !/review session/i.test(login));
check('ログイン画面が「まだ使えない」と伝えている', /not available yet/i.test(login));

await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
check('管理画面が開かない', /ご利用いただけません/.test(await page.locator('body').innerText()));

await browser.close();
console.table(results);
const ng = results.filter((r) => r.結果 === 'NG');
console.log(ng.length === 0 ? `\n全 ${results.length} 項目 OK` : `\nNG ${ng.length} 件`);
process.exit(ng.length === 0 ? 0 : 1);
