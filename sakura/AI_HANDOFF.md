# AI 引き継ぎメモ — SAKURA JAPAN BEAUTY

**ChatGPT と Claude Code が共通で参照する、現在地の記録。**
作業を始める前にここを読み、作業を終えたらここを最新にしてから push すること。

> **秘密情報は書かない。** APIキー・秘密鍵・パスワード・トークン・
> 実際の環境変数の値は、このファイルに一切書かないこと。
> 環境変数の取得手順は `sakura/docs/env-setup.md` にある（値は書かれていない）。

**最終更新：2026-09-13（Supabase Auth による本番用認証を実装）**

---

## 現在のフェーズ

**Phase 2 進行中（海外向け有料販売の接続層）。**
Phase 1（UI/UX・多言語構造・管理画面骨格）は完了。
決済・データベース・メールは**接続口まで実装済み**で、鍵が入るまで各機能は自動的に無効。

### 前提（変わっていない方針）

| 項目 | 内容 |
|---|---|
| **最優先ゴール** | 海外向け有料公開 → **最初の売上** |
| **最優先KPI** | 海外ユーザーから最初の有料購入が発生するまでの日数 |
| 主対象 | **海外ユーザー**（日本人向けサービスではない） |
| 対応言語 | 英語・繁体字中国語・韓国語 |
| 日本語の位置づけ | 原本(MASTER)・管理用・副次的販売用 |
| 販売形式 | **買い切り**（サブスクではない）／視聴期限なし／原則返金不可 |
| 動画 | **YouTube 限定公開**を購入者専用ページに埋め込む（初期費用0円） |
| 講座構成 | **3章構成**（10章構成は廃止） |
| 暫定価格 | 通常 **59,800円相当** / ローンチ **39,800円相当**（USD・TWD・KRW は未確定） |

### 講座（唯一の実商品）

**日本式サロンスタンダード / Japanese Salon Standard**

1. Japanese Beauty Philosophy
2. Japanese Salon Rules & Customer Experience
3. Bring Japanese Beauty to Your Country

---

## 今回完了したこと

**Supabase Auth による本番用の認証を実装した（前回までの最大の未実装P0）。**

- メールアドレス＋パスワードでの新規登録・ログイン・ログアウト
- **パスワードはアプリ側のDBに保存しない。** Supabase Auth が持つ
- Auth ユーザーとアプリ側の購入者行を `users.auth_user_id`（外部キー＋一意制約）で紐付け。
  本人特定はトークン検証で得た auth の ID だけを使い、メールでは照合しない
- アクセストークン／リフレッシュトークンは httpOnly Cookie。期限切れは proxy が自動で取り直す
- **Supabase Auth を設定すると、確認用ログイン（デモ）は完全に無効になる**
- メール確認が必要な設定なら「メールをご確認ください」と各言語で表示
- ログイン・登録・エラー文言を英語／繁体字中国語／韓国語／日本語で用意（日本語フォールバックなし）
- 購入権限は従来どおり `entitlements` で判定（Stripe Webhook のみが付与）
- **不具合を2件修正**：決済開始時と Webhook がメール基準で購入者行を作っており、
  Auth と紐付かない行が二重にできる状態だった。ログイン済みの購入者IDを使うよう修正

### これまでに完了していること

- 海外向けの土台（購入者画面の保護／日本語フォールバック撤廃／言語と市場の分離／
  通常価格＋ローンチ価格の構造／3章構成／エラー・404画面／言語別metadata／
  法務4ページ／問い合わせ／受講画面とYouTube登録構造）
- 決済・DB・メールの接続層（Stripe Checkout・Webhook署名検証・冪等な権限付与・
  Supabaseスキーマ・Resendメール3言語・解約権への同意UI）
- **特商法の事業者情報を反映済み**
- **公開側から非表示**：サンプル講座11件、無料仮コンテンツ5件、架空のレビュー・評価
- **main への安全な統合が完了**（Vi5側の変更は維持）

---

## 未完了の P0（公開・販売に必須）

| # | 項目 | 担当 |
|---|---|---|
| 1 | **Cloudflare への公開**（Stripe審査用URLの発行） | SAKURA |
| 2 | **`0002_auth_link.sql` の実行と `SUPABASE_ANON_KEY` の設定** | SAKURA |
| 3 | Chapter 1 の動画制作 | SAKURA |
| 4 | 各市場の確定価格と Stripe Price ID | SAKURA → Claude |
| 5 | Stripe / Resend の鍵設定 | SAKURA |
| 6 | 法務ページ・購入時同意文言の専門家確認 | 専門家 |
| 7 | 通しテスト（登録→決済→Webhook→権限→メール→視聴） | 両方 |
| 8 | パスワード再設定（P1でも可） | Claude |

**認証の実装は完了。** 残るのは鍵の設定と、実キーでの通しテスト。

---

## 現在のブロッカー

1. **Chapter 1 の動画が1本も無い** — 売る商品の実体が無い。コードでは解決できない
2. **Cloudflare 公開URLが未発行** — Stripe審査が始められない
3. **Stripe 本人確認** — 審査に営業日がかかる
4. **`SUPABASE_ANON_KEY` が未設定** — これが無いとお客様はログインできない
5. Claude Code の実行環境から Cloudflare / Vercel / Netlify に到達できない
   （接続拒否・認証情報なし）。**デプロイの実行は SAKURA 側が行う必要がある**
6. Claude Code は Supabase の実キーを持たないため、**実際のログインの通しテストは未実施**
   （偽のトークンで入れないことは自動検査で確認済み）

---

## SAKURA 側で必要なこと

**今すぐ**

1. **Cloudflare へ公開**（`sakura/docs/deploy.md`／ブラウザだけで5ステップ）
2. Stripe アカウント開設・本人確認申請（審査に日数がかかる）
3. ドメイン取得
4. **`sakura/supabase/migrations/0002_auth_link.sql` を「SQL Editor」で実行**
   （0001 は実行済み。0002 は Auth ユーザーと購入者行を結ぶために必要）
5. **`SUPABASE_ANON_KEY` を設定**（Supabase → Project Settings → API Keys → `anon`）
6. **Supabase の Authentication → Sign In / Providers で Email を有効化**し、
   「Confirm email」（メール確認）のオン／オフを決める
   ※ Supabase が送る確認メールは既定で英語。文面は Authentication →「Emails」で変更できる
7. Resend アカウント作成 → ドメイン登録 → DNS設定

**そのあと**

6. **Chapter 1 の動画撮影**（1本あれば販売開始できる）
7. 各市場の確定価格を決め、Stripe で商品と価格を作る
8. 法務ページ・同意文言の専門家確認

---

## Claude 側で次にできること

鍵が無くても着手できるもの：

1. **パスワード再設定**（Supabase Auth の recover を使う）
2. マイページを実データ（entitlements）に接続
3. 分析イベント5種の発火口
4. 購入履歴・領収書の画面
5. 受講の進捗保存（続きから再生）

鍵が入りしだい：通しテスト、Stripe CLI での Webhook 検証

---

## 公開URL

**未発行。** Cloudflare へ公開すると
`https://sakura-japan-beauty.＜サブドメイン＞.workers.dev` が発行される。
独自ドメインは未取得。

---

## 最新コミットSHA

**コードを最後に変更したコミット**（全検査を通した状態）：

| ブランチ | SHA |
|---|---|
| `main` | `39dc56ae7a31f137313bd60d2bd6e8be444ff30e` |
| `claude/init-6qnkvk` | 同上（**両者は同じコミット**） |

> この引き継ぎメモだけを更新したコミットでは SHA が進むが、コードは上記と同一。
> 実際の先頭は `git log -1 origin/main` で確認できる。

**Vi5 側の最新変更は維持されている**（`a50232e` を含む。実アプリのファイルは無変更）。

---

## デプロイ状況

| | |
|---|---|
| 公開先（予定） | Cloudflare Workers（Worker名 `sakura-japan-beauty`） |
| 状態 | **未公開** |
| ビルド | `npm run cf:build` は成功する（成果物に秘密情報が無いことも確認済み） |
| 既存 Vi5 予約サイト | Vercel。**別サービス・別名。影響しない** |
| 検索エンジン | 既定で**非掲載**。販売開始日に `SITE_INDEXABLE=true` を設定して有効化 |

---

## テスト結果（最新・マージ後に実施）

```
typecheck / lint / build / cf:build   すべて通過
publish-check      62 / 62 OK   ← 本番と同じビルド成果物（Cloudflareランタイム）で実施
auth-check         18 / 18 OK   ← 今回追加
prod-guard-check    6 /  6 OK
launch-check       36 / 36 OK
ux-check           10 / 10 OK
commerce-check     14 / 14 OK
```

認証まわりで確認していること：
users テーブルにパスワード列が無い／リポジトリ層がパスワードを扱わない／
Auth との紐付けに外部キーと一意制約がある／認証を設定すると確認用ログインが消える／
**偽のトークンでは購入者画面に入れない**／4言語でログイン画面とエラー文言が出る。

実行方法は `CLAUDE.md`「自動検査」の節を参照。

主な確認内容：4言語の表示／日本語混入なし／未確定価格を出さない／
`/mypage` `/learn` `/admin` は Cookie を偽造しても入れない／
受講権限の付与は Stripe Webhook のみ／署名検証が偽物を弾く／
HTMLに秘密情報が無い／実商品だけを公開。

---

## 次に推奨する作業

**1番目：Cloudflare へ公開する（SAKURA）**
Stripe 審査を始めるために必要。`sakura/docs/deploy.md` の手順どおり。

**2番目：`0002_auth_link.sql` の実行と `SUPABASE_ANON_KEY` の設定（SAKURA）**
これでログインが実際に動く。設定できたら「システム状況」画面が緑になる。

**3番目：Chapter 1 の動画を撮る（SAKURA）**
完璧でなくてよい。1本あれば受講画面を実物で仕上げられる。

**4番目：パスワード再設定（Claude）**
上と並行して進められる。

---

## Git 運用（重要）

- このリポジトリには**別プロダクトの Vi5 予約サイト**（`index.html` / `app.html` /
  `shop.html` / `api/` / `vercel.json` / `manifest.json`）が同居している。
  **稼働中の実サービス。絶対に変更・削除しない。**
- SAKURA JAPAN BEAUTY のコードは **`sakura/` の中だけ**。
- **force push 禁止。** Vi5 側の変更を絶対に消さない。
- 作業前に**必ず最新の `main` を取得**し、取り込んでから始める。
- Vi5 側は活発に更新されている（1日100コミットの日もある）。
