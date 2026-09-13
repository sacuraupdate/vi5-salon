/**
 * 公開前チェック。
 *
 * **本番と同じビルド成果物（Cloudflare Workers ランタイム）に対して実行する。**
 *   npm run cf:build
 *   npx wrangler dev --port 3300 --local     ← 環境変数を設定せずに起動する
 *   BASE_URL=http://localhost:3300 npm run publish-check
 *
 * 確認するのは「見せるべきものが見えること」と「見せてはいけないものが見えないこと」の両方。
 */
import { chromium, devices } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3300';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const results = [];
const check = (name, ok, detail = '') =>
  results.push({ 確認項目: name, 結果: ok ? 'OK' : 'NG', 詳細: String(detail).slice(0, 70) });

/** かな。漢字は中国語と重なるため使わない。中黒(U+30FB)は繁体字でも使うので除外 */
const KANA = /[぀-ゟ゠-ヺー-ヿ]/;

const visible = (page) =>
  page.evaluate(() => {
    const c = document.body.cloneNode(true);
    c.querySelectorAll('[aria-hidden="true"],script,style,.sr-only').forEach((n) => n.remove());
    return c.innerText;
  });

/* ── 見せるもの ───────────────────────────────────────── */
{
  const ctx = await browser.newContext(devices['iPhone 14']);
  const page = await ctx.newPage();

  for (const locale of ['en', 'ko', 'zh-TW', 'ja']) {
    await page.goto(`${BASE}/${locale}`, { waitUntil: 'networkidle' });
    const text = await visible(page);
    check(`/${locale} が正常表示`, page.url().includes(`/${locale}`) && text.length > 500, `${text.length}文字`);
    check(`/${locale} にブランド名が出ている`, /SAKURA JAPAN BEAUTY/i.test(text));
    if (locale !== 'ja') {
      check(`/${locale} に日本語が出ない`, !KANA.test(text), text.match(KANA)?.[0] ?? '');
    }
  }

  // 事業内容が言葉として読み取れるか（Stripe 審査で見られる部分）
  await page.goto(`${BASE}/en`, { waitUntil: 'networkidle' });
  const top = await visible(page);
  check('何のサービスか英語で分かる', /Japanese|salon/i.test(top));
  check('海外向けのオンライン教育だと分かる', /course|learn|online/i.test(top));

  await page.goto(`${BASE}/en/courses/japanese-salon-standard`, { waitUntil: 'networkidle' });
  const course = await visible(page);
  check('講座概要が読める', course.length > 800, `${course.length}文字`);
  check('3章構成が見える', (course.match(/Chapter|Japanese Beauty Philosophy/gi) ?? []).length > 0);
  check('買い切り・視聴期限なしが書いてある', /no expiry|time limit/i.test(course));

  // 事実でない実績を出していないこと。
  // 架空のレビュー・評価は Stripe の審査でも不利になり、恒久ルールでも禁止している
  for (const slug of ['omotenashi-counselling', 'eyelash-technique', 'japanese-salon-standard']) {
    await page.goto(`${BASE}/en/courses/${slug}`, { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: /Reviews/i }).click().catch(() => {});
    const tab = await visible(page);
    check(
      `${slug} に架空のレビュー・評価を出していない`,
      /No reviews yet/i.test(tab) && !/Jasmine|Minji|Chloe/.test(tab),
      /No reviews yet/i.test(tab) ? 'レビューなしと表示' : tab.slice(0, 50),
    );
  }

  // 法務・問い合わせ
  for (const [path, word] of [
    ['/en/contact', /Contact us/i],
    ['/en/legal/terms', /Terms of Service/i],
    ['/en/legal/privacy', /Privacy Policy/i],
    ['/en/legal/refund', /Refund Policy/i],
    ['/en/legal/tokusho', /Commercial Transaction/i],
  ]) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    check(`${path} が開ける`, word.test(await visible(page)), page.url().replace(BASE, ''));
  }

  // スマホで横スクロールしない
  await ctx.close();
  const sm = await browser.newContext(devices['iPhone SE']);
  const sp = await sm.newPage();
  for (const p of ['/en', '/en/courses/japanese-salon-standard', '/en/contact', '/en/legal/terms', '/ko', '/zh-TW']) {
    await sp.goto(`${BASE}${p}`, { waitUntil: 'networkidle' });
    const over = await sp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`iPhone SE で横スクロールしない ${p}`, over <= 1, `はみ出し ${over}px`);
  }
  await sm.close();
}

/* ── 見せてはいけないもの ─────────────────────────────── */
{
  const ctx = await browser.newContext();
  // Cookie を偽造した状態で試す
  await ctx.addCookies([
    { name: 'sjb_session', value: 'demo', url: BASE },
    { name: 'sjb_admin_role', value: 'owner', url: BASE },
  ]);
  const page = await ctx.newPage();

  for (const path of ['/en/mypage', '/en/mypage/materials', '/en/learn/japanese-salon-standard', '/ja/mypage']) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    check(`${path} に入れない`, /\/login/.test(page.url()), page.url().replace(BASE, ''));
  }

  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  const admin = await page.locator('body').innerText();
  check('/admin に入れない', /ご利用いただけません/.test(admin) && !/ダッシュボード/.test(admin));

  await page.goto(`${BASE}/admin/sales`, { waitUntil: 'networkidle' });
  check('/admin/sales に入れない', /ご利用いただけません/.test(await page.locator('body').innerText()));

  // 購入ボタンは有効化しない
  await page.goto(`${BASE}/en/courses/omotenashi-counselling`, { waitUntil: 'networkidle' });
  const submit = page.locator('#purchase button[type="submit"], aside button[type="submit"]').first();
  check('購入ボタンが押せない状態', await submit.isDisabled().catch(() => true));

  await ctx.close();
}

/* ── 秘密情報とクロール設定 ───────────────────────────── */
{
  const SECRETS = [
    [/sk_(live|test)_[A-Za-z0-9]{10,}/, 'Stripeの秘密鍵'],
    [/whsec_[A-Za-z0-9]{10,}/, 'Webhookシークレット'],
    [/\bre_[A-Za-z0-9]{16,}/, 'ResendのAPIキー'],
    [/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./, 'JWT（Supabaseの鍵）'],
    [/SERVICE_ROLE|SUPABASE_URL|STRIPE_SECRET/, '環境変数名と値'],
  ];
  const found = [];
  for (const p of ['/en', '/en/courses/japanese-salon-standard', '/en/contact', '/en/legal/terms']) {
    const html = await (await fetch(`${BASE}${p}`)).text();
    for (const [re, label] of SECRETS) if (re.test(html)) found.push(`${p}: ${label}`);
  }
  check('配信されるHTMLに秘密情報が無い', found.length === 0, found.join(' | ') || '4ページを確認');

  const robots = await (await fetch(`${BASE}/robots.txt`)).text();
  check('販売開始前は検索エンジンに載せない', /Disallow: \/\s*$/m.test(robots), robots.replace(/\n/g, ' ').slice(0, 60));

  const api = await fetch(`${BASE}/api/stripe/webhook`, { method: 'POST', body: '{}' });
  check('Webhookは署名なしでは受け付けない', api.status === 400, `HTTP ${api.status}`);
}

await browser.close();
console.table(results);
const ng = results.filter((r) => r.結果 === 'NG');
console.log(ng.length === 0 ? `\n全 ${results.length} 項目 OK` : `\nNG ${ng.length} 件 / 全 ${results.length} 項目`);
process.exit(ng.length === 0 ? 0 : 1);
