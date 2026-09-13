/**
 * 決済まわりの安全確認。
 *
 * 確認するのは次の4つ：
 *   1. 秘密の鍵がコードに書き込まれていないこと
 *   2. 受講権限を付与しているのが Webhook だけであること
 *      （決済成功画面から付与できてしまうと、支払っていない人に権限が渡る）
 *   3. Stripe の署名検証が、正しい署名だけを通すこと
 *   4. 同じ通知が2回来ても二重処理しない作りになっていること
 *
 * サーバーはこのスクリプトが自分で起動する。事前準備は不要。
 *   npm run commerce-check
 */
import { spawn } from 'node:child_process';
import { createHmac, randomBytes } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const results = [];
const check = (name, ok, detail = '') =>
  results.push({ 確認項目: name, 結果: ok ? 'OK' : 'NG', 詳細: String(detail).slice(0, 80) });

/* ── 1. 秘密の鍵がコードに入っていないか ─────────────────── */

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(ts|tsx|mjs|js|json|jsonc)$/.test(entry) ? [full] : [];
  });

const SECRET_SHAPES = [
  [/sk_(live|test)_[A-Za-z0-9]{10,}/, 'Stripe の秘密鍵'],
  [/whsec_[A-Za-z0-9]{10,}/, 'Stripe の Webhook 署名シークレット'],
  [/\bre_[A-Za-z0-9]{16,}/, 'Resend の APIキー'],
  [/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./, 'JWT（Supabase の鍵）'],
];

{
  const files = [...walk('src'), ...walk('tools'), 'package.json', 'wrangler.jsonc', '.env.example'].filter(Boolean);
  const hits = [];
  for (const f of files) {
    let text;
    try {
      text = readFileSync(f, 'utf8');
    } catch {
      continue;
    }
    for (const [re, label] of SECRET_SHAPES) {
      // この検査ファイル自身の「形の定義」は対象外
      if (f.endsWith('commerce-check.mjs')) continue;
      if (re.test(text)) hits.push(`${f}: ${label}`);
    }
  }
  check('秘密の鍵がコードに書かれていない', hits.length === 0, hits.join(' | ') || `${files.length}ファイルを確認`);
}

/* ── 2. 受講権限を付与できるのは Webhook だけか ──────────── */

{
  const granting = walk('src').filter(
    (f) => !f.includes('commerce') && /grantEntitlement\s*\(/.test(readFileSync(f, 'utf8')),
  );
  const onlyWebhook =
    granting.length === 1 && granting[0].replace(/\\/g, '/').includes('api/stripe/webhook/route.ts');
  check('受講権限を付与しているのは Webhook だけ', onlyWebhook, granting.join(' | ') || 'なし');

  const successPage = readFileSync('src/app/(site)/[locale]/checkout/success/page.tsx', 'utf8');
  check(
    '決済成功画面が権限を付与していない',
    !/grantEntitlement|createPurchase|findOrCreateUser/.test(successPage),
    '読み取りのみ',
  );
  check(
    '決済成功画面が他人の購入を表示しない',
    /purchase\.userId === session\.userId/.test(successPage),
  );
}

/* ── 3・4. 署名検証と冪等性（実際にサーバーへ送って確認する） ── */

const PORT = 3200;
const BASE = `http://localhost:${PORT}`;
// テスト用の署名シークレットを毎回その場で作る。固定値をコードに残さないため
const SECRET = `whsec_${randomBytes(24).toString('hex')}`;

const server = spawn('npx', ['next', 'dev', '-p', String(PORT)], {
  env: { ...process.env, STRIPE_WEBHOOK_SECRET: SECRET, SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '' },
  stdio: 'ignore',
});

const sign = (body, timestamp) =>
  createHmac('sha256', SECRET).update(`${timestamp}.${body}`).digest('hex');

const post = (body, signature) =>
  fetch(`${BASE}/api/stripe/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(signature ? { 'stripe-signature': signature } : {}) },
    body,
  });

try {
  // 起動を待つ
  for (let i = 0; i < 60; i += 1) {
    try {
      await fetch(`${BASE}/en`);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const body = JSON.stringify({
    id: 'evt_test_00000000',
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_test_00000000', payment_status: 'paid' } },
  });

  // 正しい署名：署名の検証は通る（データベース未接続なので 500 で再送を要求する）
  const valid = await post(body, `t=${now},v1=${sign(body, now)}`);
  check('正しい署名は検証を通過する', valid.status !== 400, `HTTP ${valid.status}`);
  check('データベース未接続なら再送を要求する（勝手に成功させない）', valid.status === 500, `HTTP ${valid.status}`);

  // 署名なし
  check('署名が無ければ拒否する', (await post(body, null)).status === 400);

  // 署名が違う
  const wrong = await post(body, `t=${now},v1=${'0'.repeat(64)}`);
  check('署名が違えば拒否する', wrong.status === 400, `HTTP ${wrong.status}`);

  // 本文だけ書き換える（署名は正しい本文のもの）
  const tampered = await post(body.replace('cs_test_00000000', 'cs_attacker_0000'), `t=${now},v1=${sign(body, now)}`);
  check('本文を書き換えたら拒否する', tampered.status === 400, `HTTP ${tampered.status}`);

  // 古い署名の使い回し（10分前）
  const old = now - 600;
  const stale = await post(body, `t=${old},v1=${sign(body, old)}`);
  check('古い署名の使い回しを拒否する', stale.status === 400, `HTTP ${stale.status}`);
} finally {
  server.kill('SIGTERM');
}

/* ── 冪等性の作りをコードで確認 ────────────────────────── */

{
  const repo = readFileSync('src/lib/commerce/supabase-repository.ts', 'utf8');
  const sql = readFileSync('supabase/migrations/0001_init.sql', 'utf8');
  check('購入は Checkout Session ごとに1件だけ（一意制約）', /stripe_session_id\s+text not null unique/.test(sql));
  check('受講権限は二重に付かない（主キー）', /primary key \(user_id, course_slug\)/.test(sql));
  check('処理済みの通知は再処理しない', /processed_at == null/.test(repo));
  check('失敗した通知は再送で処理し直せる', /if \(inserted\) return true;/.test(repo));
}

console.table(results);
const ng = results.filter((r) => r.結果 === 'NG');
console.log(ng.length === 0 ? `\n全 ${results.length} 項目 OK` : `\nNG ${ng.length} 件 / 全 ${results.length} 項目`);
process.exit(ng.length === 0 ? 0 : 1);
