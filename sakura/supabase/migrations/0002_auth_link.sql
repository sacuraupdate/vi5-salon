-- SAKURA JAPAN BEAUTY — Supabase Auth と public.users の紐付け（2回目）
--
-- 実行方法：
--   Supabase のダッシュボード → 左メニュー「SQL Editor」→「New query」
--   → このファイルの中身をすべて貼り付け →「Run」
--
-- 0001 を実行済みのプロジェクトに、あとから安全に足せる内容だけにしてある。
-- 既存のデータは消えない。
--
-- 設計：
--   * パスワードは Supabase Auth（auth.users）が持つ。**public.users には保存しない。**
--   * public.users は「アプリ側の購入者情報」だけを持ち、auth_user_id で auth.users と結ぶ。
--   * 外部キー＋一意制約で結んでいるため、取り違えや二重作成が起きない。
--   * Auth ユーザーが削除されたら、アプリ側の行も一緒に消える（on delete cascade）。

alter table public.users
  add column if not exists auth_user_id uuid unique references auth.users (id) on delete cascade;

create index if not exists users_auth_user_idx on public.users (auth_user_id);

-- メールは Auth 側が正。アプリ側は表示・照合用の写しとして持つ。
comment on column public.users.auth_user_id is
  'Supabase Auth の auth.users.id。アプリ側の購入者行と Auth ユーザーを結ぶ唯一の鍵。';
comment on column public.users.email is
  'Auth 側のメールの写し。認証には使わない（正は auth.users）。';
