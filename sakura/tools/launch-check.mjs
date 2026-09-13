/**
 * 海外有料公開に向けた自動検査。
 *
 * 確認するのは「壊れていないか」ではなく、次の事故が起きないこと：
 *   - 未ログイン・未購入で購入者向け画面や動画IDに到達できてしまう
 *   - 海外の画面に日本語が出てしまう
 *   - 未確定の価格が表示されてしまう
 *   - 言語と通貨が固定されてしまっている
 *   - 法務・問い合わせに到達できない
 */
import { readFileSync } from 'node:fs';
import { chromium, devices } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const SESSION = { name: 'sjb_session', value: 'demo', url: BASE };

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const results = [];
const check = (name, ok, detail = '') =>
  results.push({ 確認項目: name, 結果: ok ? 'OK' : 'NG', 詳細: String(detail).slice(0, 90) });

/** 日本語のかな判定。漢字は中国語と重なるため使わない。中黒（・U+30FB）は繁体字でも区切りに使うため除外する */
const KANA = /[\u3040-\u309F\u30A0-\u30FA\u30FC-\u30FF]/;

const visibleText = (page) =>
  page.evaluate(() => {
    // aria-hidden の装飾（印章など）は判定から除く
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll('[aria-hidden="true"], script, style, .sr-only').forEach((n) => n.remove());
    return clone.innerText;
  });

/* ── 1. 未ログインで購入者向け画面に入れないこと ── */
{
  const ctx = await browser.newContext(devices['iPhone 14']);
  const page = await ctx.newPage();

  for (const path of ['/en/mypage', '/en/mypage/materials', '/en/learn/japanese-salon-standard']) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
    check(`未ログインで ${path} に入れない`, /\/login/.test(page.url()), page.url().replace(BASE, ''));
  }
  await ctx.close();
}

/* ── 2. ログイン済みでも、未購入の講座の動画IDがHTMLに出ないこと ── */
{
  const ctx = await browser.newContext(devices['iPhone 14']);
  await ctx.addCookies([SESSION]);
  const page = await ctx.newPage();

  // 未購入の講座（モックの受講データに無いもの）
  await page.goto(`${BASE}/en/learn/salon-management-basics`, { waitUntil: 'domcontentloaded' });
  const html = await page.content();
  check(
    '未購入の講座では受講画面の中身が出ない',
    /have not bought/i.test(html),
    page.url().replace(BASE, ''),
  );
  check('未購入の講座のHTMLに YouTube 埋め込みが無い', !/youtube|youtube-nocookie/i.test(html));

  // 購入済みの講座：入れるが、動画未登録なので埋め込みも出ない
  await page.goto(`${BASE}/en/learn/japanese-salon-standard`, { waitUntil: 'domcontentloaded' });
  const owned = await page.content();
  check('購入済みの講座は章一覧が開ける', /Chapters/i.test(owned));
  check(
    '動画未登録の章は埋め込みを出さない',
    !/youtube-nocookie\.com\/embed/i.test(owned),
    '動画ID未登録のため',
  );
  await ctx.close();
}

/* ── 3. 海外向け画面に日本語（かな）が出ないこと ── */
{
  const ctx = await browser.newContext(devices['iPhone 14']);
  const page = await ctx.newPage();
  const paths = [
    '', '/courses', '/courses/japanese-salon-standard', '/free',
    '/instructors/sakura', '/login', '/register', '/contact', '/legal/terms',
  ];
  for (const locale of ['en', 'ko', 'zh-TW']) {
    const leaks = [];
    for (const p of paths) {
      await page.goto(`${BASE}/${locale}${p}`, { waitUntil: 'domcontentloaded' });
      const text = await visibleText(page);
      const hit = text.match(KANA);
      if (hit) {
        const at = text.indexOf(hit[0]);
        leaks.push(`${p || '/'}:${text.slice(Math.max(0, at - 12), at + 12).replace(/\s+/g, ' ')}`);
      }
    }
    check(`${locale} の画面に日本語が混ざらない`, leaks.length === 0, leaks.join(' | ') || `${paths.length}ページ`);
  }
  await ctx.close();
}

/* ── 4. 価格：未確定は出さない。市場を変えると通貨が変わる ── */
{
  const ctx = await browser.newContext(devices['iPhone 14']);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/en/courses/japanese-salon-standard`, { waitUntil: 'domcontentloaded' });
  const text = await visibleText(page);
  check('価格未確定の講座に金額を出さない', !/[$¥₩]\s?[\d,]{3,}/.test(text), text.match(/[$¥₩][\d,]+/)?.[0] ?? 'なし');

  const buy = page.locator('button:has-text("Not yet on sale")').first();
  check('価格未確定の講座は購入できない', (await buy.count()) > 0 && (await buy.isDisabled()));

  // 市場（通貨）の選択が、言語とは独立して保存されることを確認する。
  // 公開中の講座がまだ価格未確定のため、金額そのものではなく仕組みを見る
  await page.goto(`${BASE}/en`, { waitUntil: 'domcontentloaded' });
  await page.selectOption('#market', 'tw');
  await Promise.all([page.waitForLoadState('networkidle'), page.locator('form:has(#market) button[type="submit"]').click()]);
  const saved = (await ctx.cookies()).find((c) => c.name === 'sjb_market')?.value;
  check('市場の選択が保存される', saved === 'tw', `sjb_market=${saved}`);
  check('市場を変えても表示言語は変わらない', page.url().includes('/en'), page.url().replace(BASE, ''));
  await ctx.close();
}

/* ── 5. 法務・問い合わせ・404 ── */
{
  const ctx = await browser.newContext(devices['iPhone 14']);
  const page = await ctx.newPage();

  for (const doc of ['terms', 'privacy', 'refund', 'tokusho']) {
    await page.goto(`${BASE}/en/legal/${doc}`, { waitUntil: 'domcontentloaded' });
    const text = await visibleText(page);
    check(`法務ページ /legal/${doc} が開ける`, page.url().includes(`/legal/${doc}`) && text.length > 200);
    if (doc === 'terms') check('法務ページに「未確定」の注意が出る', /not yet in force/i.test(text));
  }

  await page.goto(`${BASE}/en/contact`, { waitUntil: 'domcontentloaded' });
  check('問い合わせページが開ける', /Contact us/i.test(await visibleText(page)));

  await page.goto(`${BASE}/en/this-page-does-not-exist`, { waitUntil: 'domcontentloaded' });
  const nf = await visibleText(page);
  check('404 が英語で表示される', /Page not found/i.test(nf), nf.split('\n').find(Boolean));

  await page.goto(`${BASE}/ko/this-page-does-not-exist`, { waitUntil: 'domcontentloaded' });
  check('404 が韓国語で表示される', /찾을 수 없습니다/.test(await visibleText(page)));
  await ctx.close();
}

/* ── 6. hreflang / canonical ── */
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/en`, { waitUntil: 'domcontentloaded' });
  const langs = await page.$$eval('link[rel="alternate"]', (ls) => ls.map((l) => l.hreflang));
  const canonical = await page.$eval('link[rel="canonical"]', (l) => l.href).catch(() => '');
  check(
    'hreflang が4言語 + x-default 出ている',
    ['en', 'ja', 'ko', 'zh-TW', 'x-default'].every((l) => langs.includes(l)),
    langs.join(','),
  );
  check('canonical が英語ページを指している', canonical.includes('/en'), canonical);

  const desc = await page.$eval('meta[name="description"]', (m) => m.content).catch(() => '');
  check('英語ページの説明文が日本語でない', desc.length > 0 && !KANA.test(desc), desc.slice(0, 60));
  await ctx.close();
}

/* ── 7. スマホ：横スクロールしない ── */
{
  const ctx = await browser.newContext(devices['iPhone SE']);
  const page = await ctx.newPage();
  for (const p of ['/en', '/en/courses/japanese-salon-standard', '/en/contact', '/en/legal/refund', '/en/login']) {
    await page.goto(`${BASE}${p}`, { waitUntil: 'domcontentloaded' });
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`iPhone SE で横スクロールしない ${p}`, over <= 1, `はみ出し ${over}px`);
  }
  await ctx.close();
}

/* ── 8. 購入導線と決済成功画面 ── */
{
  const ctx = await browser.newContext(devices['iPhone 14']);
  const page = await ctx.newPage();

  // 価格未確定の間は、同意チェックも購入ボタンも出さない
  await page.goto(`${BASE}/en/courses/japanese-salon-standard`, { waitUntil: 'networkidle' });
  check('価格未確定の講座には同意チェックを出さない', (await page.locator('input[name="consent"]').count()) === 0);
  check(
    '価格未確定の講座は購入ボタンを押せない',
    await page.locator('#purchase button[type="submit"]').first().isDisabled().catch(() => false),
  );

  // 販売を始めたときに同意が必須になることは、実装側で担保されていることを確認する
  // （公開中の講座に確定価格が入ったら、上の検査を「出ること」に戻す）
  const form = readFileSync('src/components/public/PurchaseForm.tsx', 'utf8');
  check('購入フォームで同意チェックが必須になっている', /name="consent"[\s\S]{0,200}required/.test(form));
  check('同意した文言の版を送っている', /CONSENT_VERSION/.test(form));
  await ctx.close();
}

/* ── 9. 決済成功画面では権限を付けない ── */
{
  const anon = await browser.newContext();
  const ap = await anon.newPage();
  await ap.goto(`${BASE}/en/checkout/success?session_id=cs_test_fake`, { waitUntil: 'networkidle' });
  check('未ログインで決済成功画面を開けない', /\/login/.test(ap.url()), ap.url().replace(BASE, ''));
  await anon.close();

  const ctx = await browser.newContext();
  await ctx.addCookies([SESSION]);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/en/checkout/success?session_id=cs_test_fake`, { waitUntil: 'networkidle' });
  const text = await page.locator('main').innerText();
  check(
    '存在しない決済IDを渡しても完了扱いにならない',
    /Confirming your payment/i.test(text),
    text.split('\n').find(Boolean),
  );
  await ctx.close();
}

await browser.close();
console.table(results);
const ng = results.filter((r) => r.結果 === 'NG');
console.log(ng.length === 0 ? `\n全 ${results.length} 項目 OK` : `\nNG ${ng.length} 件 / 全 ${results.length} 項目`);
process.exit(ng.length === 0 ? 0 : 1);
