/**
 * 認証の安全確認。
 *
 * 確認するのは次の4つ：
 *   1. パスワードをアプリ側のデータベースへ保存していないこと
 *   2. Supabase Auth を設定すると、確認用ログイン（デモ）が完全に無効になること
 *   3. 偽のアクセストークンでは購入者向け画面に入れないこと
 *   4. ログイン・新規登録の画面が4言語で正しく出ること
 *
 * サーバーはこのスクリプトが自分で起動する。事前準備は不要。
 *   npm run auth-check
 *
 * Supabase の値は毎回その場で作った偽物を渡す。実鍵は使わないし、コードにも残さない。
 * 偽の接続先には到達できないため、トークン検証は必ず失敗する。
 * 「検証に失敗したら入れない」ことを確かめるのが目的。
 */
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { chromium, devices } from '@playwright/test';

const results = [];
const check = (name, ok, detail = '') =>
  results.push({ 確認項目: name, 結果: ok ? 'OK' : 'NG', 詳細: String(detail).slice(0, 70) });

/* ── 1. パスワードをアプリ側へ保存していないか（コードとスキーマ） ── */
{
  const repo = readFileSync('src/lib/commerce/supabase-repository.ts', 'utf8');
  const schema0001 = readFileSync('supabase/migrations/0001_init.sql', 'utf8');
  const schema0002 = readFileSync('supabase/migrations/0002_auth_link.sql', 'utf8');
  const auth = readFileSync('src/lib/auth.ts', 'utf8');

  check('users テーブルにパスワード列が無い', !/password/i.test(schema0001 + schema0002));
  check('リポジトリ層がパスワードを扱っていない', !/password/i.test(repo));
  check(
    'パスワードは Supabase Auth へ渡すだけ',
    /JSON.stringify\(\{ email, password \}\)/.test(auth) && !/password/.test(readFileSync('src/lib/session.ts', 'utf8')),
  );
  check('Auth ユーザーとの紐付けに外部キーと一意制約がある', /auth_user_id uuid unique references auth\.users/.test(schema0002));
}

/* ── 2〜4. 偽の Supabase 設定でサーバーを起動して確かめる ── */
const PORT = 3400;
const BASE = `http://localhost:${PORT}`;
const fakeEnv = {
  SUPABASE_URL: `https://${randomBytes(10).toString('hex')}.supabase.co`,
  SUPABASE_SERVICE_ROLE_KEY: randomBytes(32).toString('hex'),
  SUPABASE_ANON_KEY: randomBytes(32).toString('hex'),
  // 認証が設定されていれば、デモが有効でも無視されるはず
  SITE_DEMO_MODE: 'true',
};

const server = spawn('npx', ['next', 'dev', '-p', String(PORT)], {
  env: { ...process.env, ...fakeEnv },
  stdio: 'ignore',
  detached: true,
});

let browser;
try {
  for (let i = 0; i < 60; i += 1) {
    try {
      await fetch(`${BASE}/en`);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const visible = (page) => page.locator('main').innerText();

  // 2. 認証を設定したら、確認用ログインは消えること
  {
    const ctx = await browser.newContext(devices['iPhone 14']);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/en/login`, { waitUntil: 'networkidle' });
    const text = await visible(page);
    check('認証を設定すると確認用ログインのボタンが消える', !/review session/i.test(text));
    check('ログインフォームが使える状態になる', !/not available yet/i.test(text));
    check('ログインボタンが押せる', !(await page.locator('form button[type="submit"]').first().isDisabled()));
    await ctx.close();
  }

  // 3. 偽のセッションでは入れないこと
  {
    const ctx = await browser.newContext();
    // 確認用 Cookie を偽造（認証設定済みなので無効のはず）
    await ctx.addCookies([{ name: 'sjb_session', value: 'demo', url: BASE }]);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/en/mypage`, { waitUntil: 'networkidle' });
    check('確認用Cookieを偽造しても入れない', /\/login/.test(page.url()), page.url().replace(BASE, ''));
    await ctx.close();

    // 偽のアクセストークン（検証は必ず失敗する）
    const ctx2 = await browser.newContext();
    await ctx2.addCookies([
      { name: 'sjb_at', value: `fake.${randomBytes(24).toString('hex')}.token`, url: BASE },
    ]);
    const page2 = await ctx2.newPage();
    for (const path of ['/en/mypage', '/en/learn/japanese-salon-standard']) {
      await page2.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      check(`偽のトークンでは ${path} に入れない`, /\/login/.test(page2.url()), page2.url().replace(BASE, ''));
    }
    await ctx2.close();
  }

  // 4. 4言語で画面が出ること
  {
    const ctx = await browser.newContext(devices['iPhone 14']);
    const page = await ctx.newPage();
    const KANA = /[぀-ゟ゠-ヺー-ヿ]/;
    for (const locale of ['en', 'ko', 'zh-TW']) {
      for (const path of ['/login', '/register']) {
        await page.goto(`${BASE}/${locale}${path}`, { waitUntil: 'networkidle' });
        const text = await visible(page);
        const hasForm = (await page.locator('input[type="email"]').count()) > 0;
        check(`${locale}${path} が表示され日本語が混ざらない`, hasForm && !KANA.test(text), hasForm ? '' : 'フォームなし');
      }
    }
    // エラー文言が顧客の言語で出ること
    await page.goto(`${BASE}/ko/login?error=invalid-credentials`, { waitUntil: 'networkidle' });
    check('ログイン失敗の文言が韓国語で出る', /일치하지 않습니다/.test(await visible(page)));
    await page.goto(`${BASE}/zh-TW/register?status=confirm`, { waitUntil: 'networkidle' });
    check('メール確認の案内が繁体字で出る', /確認連結/.test(await visible(page)));
    await ctx.close();
  }
} finally {
  if (browser) await browser.close();
  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {
    server.kill('SIGTERM');
  }
}

console.table(results);
const ng = results.filter((r) => r.結果 === 'NG');
console.log(ng.length === 0 ? `\n全 ${results.length} 項目 OK` : `\nNG ${ng.length} 件 / 全 ${results.length} 項目`);
process.exit(ng.length === 0 ? 0 : 1);
