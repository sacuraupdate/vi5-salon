# 公開手順（Stripe 審査用の無料URLを出す）

目的は **Stripe の事業確認で見せられる公開URLを作ること**です。販売開始ではありません。
決済が未接続のままで問題ありません。

**この手順は、既存の Vi5 予約サイトに一切影響しません。**
Vi5 は Vercel、こちらは Cloudflare Workers と、別のサービスに置くためです。
Worker の名前も `sakura-japan-beauty` にしてあり、取り違えようがありません。

---

## 方法A：ブラウザだけで公開する（推奨。ターミナル不要）

### A-1. Cloudflare に GitHub をつなぐ

1. https://dash.cloudflare.com を開いてログイン（無料アカウントで構いません）
2. 左メニューの **「Compute (Workers)」** をクリック
3. **「Create」**（または「アプリケーションを作成」）をクリック
4. **「Import a repository」**（リポジトリをインポート）を選ぶ
5. **「Connect GitHub」** を押し、GitHub のログインを済ませる
6. リポジトリの一覧から **`sacuraupdate/vi5-salon`** を選ぶ

### A-2. ビルド設定を入れる

次の4か所だけ、下の通りに入力してください。**ここを間違えると公開できません。**

| 項目 | 入れる値 |
|---|---|
| **Branch（ブランチ）** | `claude/init-6qnkvk` |
| **Root directory（ルートディレクトリ）** | `sakura` |
| **Build command（ビルドコマンド）** | `npm run cf:build` |
| **Deploy command（デプロイコマンド）** | `npx wrangler deploy` |

### A-3. 環境変数を1つだけ入れる

同じ画面の **「Variables and Secrets」** で、**Variable（秘密ではないほう）** を1つ追加します。

| 名前 | 値 |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://sakura-japan-beauty.＜あなたのサブドメイン＞.workers.dev` |

> サブドメインが分からない場合は、**いったん空欄のまま進めて構いません。**
> 公開後にURLが確定するので、そのURLをここに入れて「Retry deployment」を押してください。

**ここで絶対に入れないもの：**

- ❌ `SITE_DEMO_MODE`
- ❌ `ADMIN_DEMO_MODE`
- ❌ `SITE_INDEXABLE`

この3つを入れると、**管理画面や購入者画面が誰でも開ける状態になります。**
Stripe 審査の段階では1つも入れないでください。

### A-4. 公開する

1. **「Deploy」** を押す
2. 3〜5分ほど待つ
3. 完了すると `https://sakura-japan-beauty.＜サブドメイン＞.workers.dev` が表示されます

**これが Stripe に提出するURLです。**

---

## 方法B：ターミナルで公開する（2コマンド）

```
cd sakura
npx wrangler login      # ブラウザが開くので許可する（初回だけ）
npm run cf:deploy
```

最後に表示される `https://....workers.dev` が公開URLです。

---

## 公開できたら必ず確認する

ブラウザで次を開いて、**見えるべきものが見え、見えてはいけないものが見えない**ことを確かめてください。

### 見えるべきもの（すべて開けること）

- `/en` … 英語のトップ
- `/ko` … 韓国語のトップ
- `/zh-TW` … 繁体字中国語のトップ
- `/en/courses/japanese-salon-standard` … 講座の説明（3章構成・買い切り・視聴期限なし）
- `/en/contact` … 問い合わせ
- `/en/legal/terms` / `privacy` / `refund` / `tokusho` … 法務4ページ

### 見えてはいけないもの（すべて閉じていること）

- `/en/mypage` → ログイン画面に飛べばOK
- `/en/learn/japanese-salon-standard` → ログイン画面に飛べばOK
- `/admin` → 「管理画面は現在ご利用いただけません」と出ればOK

自動でも確認できます（ターミナルを使える場合）：

```
BASE_URL=https://＜公開したURL＞ npm run publish-check
```

---

## Stripe に提出するURL

事業内容がいちばん分かるのは次の2つです。両方提出できます。

| URL | 何が分かるか |
|---|---|
| `https://＜公開URL＞/en` | ブランド名・何のサービスか・対象者 |
| `https://＜公開URL＞/en/courses/japanese-salon-standard` | 販売する商品・3章構成・買い切り・視聴期限なし |

返金についてを聞かれたら `https://＜公開URL＞/en/legal/refund` を出してください。

---

## 独自ドメインに切り替えるとき

ドメインを取得したあとの作業です。**公開URLは変わりますが、作り直しは不要です。**

1. Cloudflare の Workers の画面 → **「Settings」** → **「Domains & Routes」** → **「Add」→「Custom domain」**
2. 取得したドメインを入力する（ネームサーバーを Cloudflare に向けている必要があります）
3. **`NEXT_PUBLIC_SITE_URL` を新しいドメインに変更**して、もう一度デプロイする
   - これを忘れると、検索エンジン向けの情報（canonical / hreflang）が古いURLのままになります
4. Stripe の **Webhook のURL** を新しいドメインに変更する
5. Resend の **送信ドメイン**を新しいドメインで登録し直す
6. Stripe の事業情報のURLを新しいドメインに更新する

---

## 販売を開始する日にすること

Stripe 審査が通り、動画と価格が揃ってからです。

1. `SITE_INDEXABLE=true` を追加する（検索エンジンへの掲載が始まります）
2. `docs/env-setup.md` の環境変数をすべて設定する
3. 講座の `pricing.status` を `confirmed` にし、Stripe の Price ID を入れる
4. 法務ページと購入時の同意文言を、専門家の確認済みのものに差し替える

**それまでは検索結果に出ません（意図した動作です）。** 直接URLを開く分には問題なく見えます。
