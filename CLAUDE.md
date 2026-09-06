# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Vi5 は大阪・北浜のビューティーサロン（まつ毛・眉・ハーブピーリング等）の予約 + サロン管理 PWA。
ビルドツール・パッケージマネージャ・テストは一切なく、**素の HTML/CSS/JS を Vercel が静的配信するだけ**。
UI 文言・コメント・コミットメッセージはすべて日本語。利用者はサロンスタッフとお客様（非エンジニア）。

## Build / run / deploy

- ビルドコマンドなし。`npm` も `package.json` もない。ローカル確認は静的サーバで十分（例: `python3 -m http.server 8000`）。
  ただし `/api/*` と rewrite（`/shop`、`/api-sync`、`/api-diag`）は Vercel 上でしか動かないので、
  API に触る変更は本番デプロイで確認するしかない。
- デプロイ = `main` への push（Vercel 自動デプロイ）。作業ブランチにいる場合はそのブランチを push するだけでは本番に出ない。
- `api/base-sync.js` は Vercel cron（毎日 18:00 UTC）で実行され、`maxDuration: 60`。
- 診断: `/api-diag`（同期状況・商品件数）、`/shop?debug=1`（`salon:diag` を画面に表示）。

## 変更時に必ず守ること

1. **`index.html` の `APP_REV` を必ず上げる**（例: `r20260907a` → `r20260907b`）。
   起動時に `localStorage['vi5:rev']` と比較して 1 回だけ強制リロードする仕組みになっており、
   これを上げないとお客様・スタッフの端末に古い HTML が残り続ける。
2. **コミットメッセージは「日本語の変更内容の羅列 + 末尾に新しい `APP_REV`」**。既存の履歴に合わせる。
   例: `お知らせ長文は▼で展開/資格バッジ何個でも r20260906y`
3. `index.html` が本体。**`app.html` は古いコピー（rev が数日遅れ）で、どこからも参照されていない**。
   触らないこと。逆に「アプリが直らない」時は app.html を編集していないか疑う。

## Architecture

### ファイル構成

| ファイル | 役割 |
|---|---|
| `index.html` (~750KB, 4000行) | 本体。お客様サイト + マイページ + スタッフ管理画面がすべてこの 1 ファイル（HTML/CSS/JS 全部入り）。 |
| `shop.html` (`/shop`) | 独立したオンラインショップ。`salon:eshop` を読むだけの軽量ページ。 |
| `api/*.js` | Vercel Serverless Functions（CommonJS `module.exports = async (req,res) => {}`）。 |
| `vercel.json` | rewrites / cache-control / cron。 |
| `app.html` | **旧版の残骸。参照なし。** |

### データストア（DB スキーマなし・巨大 JSON blob）

Supabase の `kv` テーブル（`key` / `value`）に JSON 文字列を丸ごと入れている。マイグレーションは
フロントの `xxxMigrate()` 関数群（`normDATA()` / `renderAdmin()` 冒頭で実行）が担う。

- `salon:data` → グローバル `DATA`。顧客・予約・スタッフ・メニュー・シフト・設定・クーポン・お知らせ等。
- `salon:work` → グローバル `WORK`。タスク・チャット・業務報告・打刻・給与・カルテ・注文。
- `salon:eshop` → shop.html 用の商品スナップショット（`saveData()` が副次的に書き出す）。
- `salon:bak:<曜日>` / `salon:bak:m<月>` → `backupSoon()` による自動バックアップ。
- `salon:diag` → base-sync の実行結果。

読み書きの経路が 2 本ある。値は文字列 / 配列で多重にラップされて入っていることがあるため、
どのコードも「4 回まで JSON.parse / 配列の先頭を取る」ループで正規化している（`directLoad`, `kvGet`, `kv`）。

- 通常: Supabase Edge Function `POST /functions/v1/data`（`api()` / `apiOp()`）。
  `action: 'public' | 'customer' | 'full' | 'save' | 'op'`。**この Edge Function のソースはこのリポジトリにない。**
- ダイレクトモード: PostgREST を直叩き（`directLoad` / `directSave`、`localStorage['vi5:direct']==='1'`）。
  Edge Function が古い / 落ちている時の救済経路。

### データ消失防止（触る時は特に慎重に）

複数端末が同じ blob を丸ごと上書きするため、防御が幾重にも入っている。壊すと顧客データが消える。

- `saveData()` は保存直前に必ず `directLoad()` でサーバ最新を取り、`mergeProtect()` で統合してから書く。
  顧客・予約・シフト・紹介は**絶対に減らさない**方向にマージする。
- `state.dataFull` / `state.dataFromDB` が立っていない（= 全データを読めていない）時は保存しない。
- 顧客 0 件・スタッフ 0 件になる保存は中止する。
- 削除は「墓標（tombstone）」方式: `deletedCust`, `delBoards`, `delTasks`, `delReports`, `delOrders` に
  ID を残し、マージで復活しないようにする。**削除機能を足す時はこの方式に合わせること。**
- `WORK` 側は `mergeWork()`。タスク・報告・注文は「タイムスタンプが新しい方を採用」、チャットは ID 結合。
- `localStorage['vi5:lastgood'] / ['vi5:datacache']` に端末側キャッシュを持ち、`autoRescue()` / `rescueCheck()` で復旧できる。

### フロントの作り（フレームワークなし）

- 単一の `state` オブジェクト + `render()`。`render()` が `state.view` を見て
  `renderHome / renderCustomer / renderBoard / renderStaffIntro / renderCourse / renderCareDocs /
  renderEshop / renderMypage / renderAdmin` のいずれかを呼び、`app.innerHTML` をテンプレートリテラルで丸ごと差し替える。
  その直後にイベントハンドラを `byId(...).onclick = ...` / `app.querySelectorAll('[data-xxx]')` で貼り直す。
  **DOM を部分更新するコードを書かない。state を変えて `render()` を呼ぶ。**
- 遷移は `go(view)`。`_pushHistory()` / `popstate` で戻るボタンに対応。
- 管理画面のタブは `renderAdmin()` 内の `tabs` 配列（`todo / chat / bookings / schedule / customers /
  report / campaign / money / settings`）+ `state.adminTab`。
- 20 秒間隔のポーリングで `refresh()` / `refreshWork()` を回すが、`userBusy()`（入力中・編集中・特定タブ）なら何もしない。
  再描画で入力内容が消えるのを防ぐためなので、この判定を緩めないこと。
- 認証は簡易。`salon:staffpw`（サロン共有パスワード）で管理画面、`ownerPin()`（既定 4351）で SAKURA=オーナー、
  お客様は電話番号 + パスワード。スタッフ本人の識別は `localStorage['vi5:salon:me']`（`s1`/`s2`/`s3`）。
- 画像はすべて data URI で JSON に埋め込む。必ず `shrinkDataURL()` / `wkCompress()` で縮めてから保存する。
- 予約枠計算: `OPEN_HOUR=9, LAST_RECEPTION=21, CLOSED_DOW=2`（火曜定休）。
  `effectiveShift()`（`shiftOverrides` → 曜日シフトの順）→ `staffWorks()` → `staffSlotOpen30()` / `anyStaffSlot30()`。
  `s0` は「指名なし」の擬似スタッフ ID。

### API endpoints

- `POST /api/cust` — お客様操作のサーバ実行（`op`: `public` / `login` / `register` / `referral` /
  `readNotices` / `board` / `order`）。`publicView()` が個人情報・`staffPw`・`ownerPin`・`gcalHook` を
  落としてから返す。**他のお客様の情報をブラウザに出さないための境界なので、返却内容を広げない。**
- `POST /api/ai` — 音声入力の文章整え。`ANTHROPIC_API_KEY`（Vercel 環境変数）を使う。
  唯一の環境変数依存。未設定でも入力文をそのまま返して壊れない作りにしてある。
- `GET /api/base-sync`（= `/api-sync`, cron） — BASE の公開店 / 非公開店から sitemap 経由で全商品を取得し
  `salon:eshop` を更新。手動編集（`pw` / `hide` / `desc` / `catManual`）は保持。再開可能。
- `GET /api/base-import?shop=public|secret&page=N` — 管理画面からの手動インポート。
- `GET /api/shift-ical?s=s1|s2|s3|book` — シフト / 予約を ICS 配信（Google カレンダー購読用）。
- `GET /api/diag`（= `/api-diag`） — 同期状況。

Google カレンダーへの書き込みは別系統で、`DATA.settings.gcalHook`（Apps Script の URL）へ
`pushGCal()` / `pushShiftGCal()` が `mode:'no-cors'` で POST する（成否は取れない）。

### 注意（秘匿情報）

Supabase の URL と publishable key、BASE 非公開店のパスワード（`5555`）、既定のオーナー PIN は
すべてソースにハードコードされている。既存の方針なので新規に足す時も同じ場所に合わせるが、
**サービスロールキー等の本物の秘密は絶対にここへ書かない**（`ANTHROPIC_API_KEY` と同様に Vercel 環境変数へ）。

## 編集の実務

`index.html` は 1 行が最大 13,000 文字を超える行を含む（16 行が 2,000 文字超）。
全体を読み込もうとせず、`grep -n` で対象を特定してから `sed -n 'X,Yp'` で該当箇所だけ読む。
テンプレートリテラル内のバッククォート・`${}` のエスケープ崩れに注意する（管理画面の描画が丸ごと落ちる）。
