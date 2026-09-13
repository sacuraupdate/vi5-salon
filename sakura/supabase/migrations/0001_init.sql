-- SAKURA JAPAN BEAUTY — 本番用スキーマ（初回）
--
-- 実行方法：
--   Supabase のダッシュボード → 左メニュー「SQL Editor」→「New query」
--   → このファイルの中身をすべて貼り付け →「Run」
--
-- 設計の前提：
--   * 海外の購入者が対象。住所・電話番号・フリガナは保持しない。
--   * 買い切り。サブスクリプションではない。視聴期限は原則なし（expires_at は NULL）。
--   * 受講権限（entitlements）は Stripe の Webhook で支払いを確認したあとにだけ作る。
--   * アプリは service_role キーでサーバーから接続する。
--     そのため全テーブルで RLS を有効にし、ポリシーを1つも作らない。
--     ＝ もし公開用のキーが漏れても、このデータは1行も読めない。

create extension if not exists pgcrypto;

-- ── 購入者 ────────────────────────────────────────────────
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,          -- 小文字で保存する（アプリ側で変換）
  name        text,
  country     text,                          -- 自己申告。必須にしない
  locale      text not null default 'en',    -- 購入者が選んだ言語。メールもこの言語で送る
  market      text not null default 'global-usd', -- 販売市場。言語とは別に持つ
  created_at  timestamptz not null default now()
);

-- ── 購入 ──────────────────────────────────────────────────
create table if not exists public.purchases (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users (id) on delete restrict,
  course_slug           text not null,
  status                text not null check (status in ('pending', 'paid', 'refunded', 'failed')),
  market                text not null,
  currency              text not null,
  amount                numeric(12, 2) not null,  -- 表示単位。請求時の金額を固定して残す
  -- 同じ決済を二度記録しないための鍵。Webhook の冪等性はここで担保する
  stripe_session_id     text not null unique,
  stripe_payment_intent text,
  purchased_at          timestamptz not null default now(),
  created_at            timestamptz not null default now()
);

create index if not exists purchases_user_idx on public.purchases (user_id);
create index if not exists purchases_course_idx on public.purchases (course_slug);

-- ── 受講権限 ──────────────────────────────────────────────
-- 主キーが (user_id, course_slug) なので、同じ権限は二重に作られない
create table if not exists public.entitlements (
  user_id     uuid not null references public.users (id) on delete cascade,
  course_slug text not null,
  granted_at  timestamptz not null default now(),
  expires_at  timestamptz,                   -- NULL = 無期限（既定）
  primary key (user_id, course_slug)
);

-- ── Stripe の通知ログ ─────────────────────────────────────
-- 同じイベントを2回処理しないための記録。
-- processed_at が NULL のまま残っているものは「途中で失敗した」ことを意味し、
-- Stripe が再送したときに再処理される。
create table if not exists public.webhook_events (
  id           text primary key,             -- Stripe のイベントID（evt_...）
  type         text not null,
  received_at  timestamptz not null default now(),
  processed_at timestamptz,
  note         text
);

-- ── 同意の記録 ────────────────────────────────────────────
-- EU・英国などのデジタルコンテンツ解約権に対応するための証跡。
-- 文言を変えたら text_version を必ず新しくする（過去の同意がどの版か分かるように）。
create table if not exists public.consents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  purchase_id  uuid references public.purchases (id) on delete set null,
  kind         text not null,                -- 'immediate-access-waiver'
  text_version text not null,
  locale       text not null,
  agreed_at    timestamptz not null default now(),
  -- purchase_id が NULL でも重複を防ぐため nulls not distinct を付ける
  constraint consents_unique unique nulls not distinct (user_id, purchase_id, kind)
);

-- ── 問い合わせ ────────────────────────────────────────────
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  topic      text not null,
  message    text not null,
  locale     text not null,
  market     text,
  status     text not null default 'open' check (status in ('open', 'answered')),
  created_at timestamptz not null default now()
);

-- ── アクセス制御 ──────────────────────────────────────────
-- RLS を有効にし、ポリシーを作らない。
-- アプリは service_role キーで接続するため影響を受けない。
-- 公開用の anon キーからは、これらのテーブルを一切読めない。
alter table public.users            enable row level security;
alter table public.purchases        enable row level security;
alter table public.entitlements     enable row level security;
alter table public.webhook_events   enable row level security;
alter table public.consents         enable row level security;
alter table public.contact_messages enable row level security;
