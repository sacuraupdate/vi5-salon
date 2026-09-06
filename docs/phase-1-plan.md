# SAKURA JAPAN BEAUTY — Phase 1 実装計画

作成日：2026-09-06 ／ 状態：**未承認・実装未着手**
根拠：`CLAUDE.md`（恒久ルール）＋ 本リポジトリの実地確認 ＋ npm レジストリでの実バージョン照会

---

## 1. 現状確認（実地確認済み・推測なし）

### リポジトリ

`sacuraupdate/vi5-salon` / ブランチ `claude/init-6qnkvk`

```
CLAUDE.md          SAKURA JAPAN BEAUTY 恒久ルール（前回作成）
README.md          1行のみ（"# vi5-salon"）
docs/
  vi5-salon-app.md 既存サロンアプリの技術メモ
index.html         既存サロン予約 PWA 本体（750KB・稼働中）
app.html           同 旧コピー（参照なし）
shop.html          同 オンラインショップ
api/*.js           同 Vercel Functions 6本
vercel.json        同 rewrites / cron / cache 設定
manifest.json, hero.jpg, icon-*.png
```

**確認できた事実：**

- **SAKURA JAPAN BEAUTY のコードは 1 行も存在しない。** Phase 1 は完全な新規作成。
- `package.json` / `tsconfig.json` / `next.config.*` / `.ts` / `.tsx` は**リポジトリ内に 1 つも無い**（`find` で確認）。
  → 既存のビルド設定・依存関係・lint 設定は**流用できるものが無い**。ゼロから作る。
- ルートの既存ファイル群は**別プロダクトの稼働中サービス**。`vercel.json` がルートの `index.html` を配信する前提になっており、
  **同じルートに Next.js を置くと確実に衝突する**（後述リスク R-1）。
- 未 push のコミットが 2 件（`5f11cd6`, `e4da958`）。**リモートへの push が 403 で拒否される状態が継続**（後述リスク R-0）。

### 実行環境

| 項目 | 実測値 |
|---|---|
| Node.js | **v22.22.2**（`node -v`） |
| npm | **10.9.7** |
| npx | `/opt/node22/bin/npx` |
| Chromium | `/opt/pw-browsers/chromium`（Playwright 設定済み・追加DL不要） |

---

## 2. Phase 1 実装方針

### 基本姿勢

1. **画面の質を最優先**。バックエンドは作らない。データは全てモック。
2. **モックと本番データアクセス層を最初から分離**する。
   ページは必ず「リポジトリ層のインターフェース」経由でデータを取得し、**モック JSON を直接 import しない**。
   → Phase 2 以降で Supabase 実装に差し替える際、**ページ側の変更をゼロにする**のが目的。これが作り直しを防ぐ最大の設計判断。
3. **管理画面を `[locale]` の外に置く**。ルーティング構造として日本語固定を保証し、
   CLAUDE.md §3-1（管理画面は必ず日本語）を「実装者が気をつける」ではなく**構造で守る**。
4. **過剰設計をしない**。Phase 1 では以下を作らない：DB スキーマ、認証基盤、状態管理ライブラリ、
   マルチテナント抽象化、デザインシステムの独立パッケージ化。

### やらないこと（CLAUDE.md 準拠・Phase 1 対象外）

本番 Stripe 決済／本格的な動画ストリーミング／認定審査／Instagram 自動投稿／AI API 接続／
高度な売上分析／法人ライセンス／コミュニティ／専用アプリ／複雑な SaaS 機能／RLS を含む本格認証

---

## 3. 使用技術（2026-09-06 に npm レジストリで実測。推測ではない）

| ライブラリ | 採用版 | 確認した根拠 |
|---|---|---|
| Next.js | **16.3.4**（App Router） | `latest`。`engines.node >=20.9.0` → Node 22.22.2 で可 |
| React / React DOM | **19.2.8** | next 16.3.4 の peer は `^18.2.0 \|\| ^19.0.0` → 適合 |
| TypeScript | **6.0.3**（※ `latest` の 7.0.2 は採らない） | 下記 ⚠ 参照 |
| Tailwind CSS | **4.3.3** | `latest`。v4 は CSS ファースト設定（`@theme`）で `tailwind.config.js` を使わない |
| next-intl | **4.14.2** | peer `next: ... \|\| ^16.0.0` → next 16 を明示サポート |
| lucide-react | **1.41.0** | peer `react ^19` 適合。線画アイコンで統一（CLAUDE.md §8） |
| ESLint | **10.10.0** ＋ eslint-config-next 16.3.4 | eslint-config-next の peer `eslint >=9.0.0` |
| Playwright | @playwright/test **1.63.0** | 本環境に Chromium 導入済み |

### ⚠ TypeScript は `latest` を使わない（重要）

- npm の `typescript@latest` は **7.0.2**。
- しかし **`typescript-eslint@8.69.0`（最新）の peer は `typescript >=4.8.4 <6.1.0`** で、**TS 7 系を未サポート**。
- `eslint-config-next` の TypeScript ルールは typescript-eslint に依存する。
- CLAUDE.md §19 が **lint の通過を完了条件**にしている以上、TS 7 は採用できない。
- → **TypeScript 6.0.3 を採用**（typescript-eslint のサポート範囲 `<6.1.0` の上限）。
  typescript-eslint が TS 7 対応版を出した時点で移行を再検討する。

**これは「最新だから使う」を避けた意図的な判断であり、実際の peer 情報に基づく。**

### ホスティング（Phase 1 では確定不要・調査結果のみ）

- `@opennextjs/cloudflare@1.20.6` の peer は `next: >=15.5.24 <16 || >=16.3.3` → **next 16.3.4 は対応範囲内**。`wrangler ^4.125.0` が必要。
- ただし Phase 1 は**ローカル確認のみで完結**するため、ホスティング確定は Phase 1 の終盤〜Phase 2 で行う。
- 方針：**特定ホスティングに依存するコードを書かない**（Edge 専用 API・プラットフォーム固有機能を使わない）。

---

## 4. 作成・変更予定ファイル

### 変更するもの

- `CLAUDE.md` — Phase 表記を「Phase 1 実装中」へ更新／確定した技術版を §18 に反映（**実装開始が承認された後**）

### 既存ファイルへの影響

**なし。** 既存サロンアプリ（`index.html` / `app.html` / `shop.html` / `api/` / `vercel.json` / 画像類）には**一切触れない**。

### 新規作成（配置先は §13 R-1 の決定待ち。ここでは `<APP_ROOT>` と表記）

```
<APP_ROOT>/
├── package.json / tsconfig.json / next.config.ts / eslint.config.mjs
├── postcss.config.mjs                    # Tailwind 4
├── .env.example                          # NEXT_PUBLIC_DATA_SOURCE=mock 等
├── src/
│   ├── middleware.ts                     # next-intl のロケール判定
│   ├── app/
│   │   ├── layout.tsx                    # html/body・フォント読み込み
│   │   ├── globals.css                   # @theme（デザイントークン）
│   │   ├── [locale]/                     # ← 購入者向け（4言語）
│   │   │   ├── layout.tsx                # ヘッダー/フッター/言語スイッチャー
│   │   │   ├── page.tsx                  # TOP
│   │   │   ├── courses/page.tsx          # 講座一覧
│   │   │   ├── courses/[slug]/page.tsx   # 講座詳細
│   │   │   ├── instructors/[id]/page.tsx # SAKURA / TOMOMI 紹介
│   │   │   ├── free/page.tsx             # 無料コンテンツ一覧
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── mypage/…                  # home / courses / materials / certificates / account
│   │   └── admin/                        # ← 管理画面（日本語固定・[locale] の外）
│   │       ├── layout.tsx                # サイドナビ＋役割切替（Phase 1 はモック）
│   │       ├── page.tsx                  # ダッシュボード
│   │       └── sales / courses / studio / students / certificates /
│   │           posts / products / inquiries / ai / system / settings
│   ├── components/
│   │   ├── ui/                           # Button, Card, Tabs, Badge, Stat, Accordion, Field…
│   │   ├── brand/                        # SakuraPetal, SectionDivider, Logo, PhotoFrame
│   │   ├── public/                       # Hero, CategoryCard, CourseCard, PurchaseCard…
│   │   └── admin/                        # AdminSidebar, KpiCard, TodoList, QuickActions…
│   ├── lib/
│   │   ├── data/
│   │   │   ├── types.ts                  # ドメイン型
│   │   │   ├── repositories.ts           # ★インターフェース定義
│   │   │   ├── index.ts                  # ★provider 切替（mock / supabase）
│   │   │   └── mock/                     # courses.ts, instructors.ts, … + JSON
│   │   ├── i18n/                         # locales 定義・routing・翻訳ステータス判定
│   │   ├── money.ts                      # 通貨表示（市場別独立価格）
│   │   └── auth/mock-session.ts          # Phase 1 の役割切替のみ
│   ├── messages/                         # ja.json / en.json / ko.json / zh-TW.json（UI文言）
│   └── public/                           # 差し替え前提のプレースホルダ画像
└── tests/e2e/                            # Playwright（クリック数・スマホ表示の検証）
```

---

## 5. ルーティング案

### 購入者向け（4 言語）

`localePrefix: 'always'` を採用 → **全ロケールで必ず `/ja/`・`/en/` が付く**。
理由：既定言語だけ URL 形状が変わると、翻訳ステータス管理・言語スイッチャー・SEO の分岐が複雑になるため。

| パス | 画面 |
|---|---|
| `/[locale]` | TOP |
| `/[locale]/courses` | 講座一覧（絞り込みは URL クエリ `?category=&instructor=&level=&lang=`） |
| `/[locale]/courses/[slug]` | 講座詳細（タブは `?tab=` で共有可能に） |
| `/[locale]/instructors/sakura` / `/tomomi` | 講師紹介 |
| `/[locale]/free` | 無料コンテンツ一覧 |
| `/[locale]/login` / `/register` | 認証 UI（Phase 1 は見た目のみ） |
| `/[locale]/mypage` | マイページ ホーム |
| `/[locale]/mypage/courses` / `materials` / `certificates` / `account` | 各サブ画面 |

- `/` へのアクセスは middleware で `Accept-Language` を見て該当ロケールへリダイレクト（既定 `ja`）。

### 管理画面（**`[locale]` の外＝日本語固定**）

`/admin` ／ `/admin/sales` ／ `/courses` ／ `/studio` ／ `/students` ／ `/certificates` ／
`/posts` ／ `/products` ／ `/inquiries` ／ `/ai` ／ `/system` ／ `/settings`

- **SAKURA と TOMOMI で別ツリーを作らない。** 同一ルートに対し
  「ナビ項目の出し分け」＋「ページ単位の権限ガード」で表示を変える。
  理由：CLAUDE.md §9 の「権限判定を一箇所に集約」「将来の権限追加を阻害しない」を満たすため。
  画面を二重に持つと、後で権限が増えるたび画面が増殖する。
- Phase 1 は本物の認証を作らないため、**画面右上に役割切替（SAKURA / TOMOMI）**を置き、両方の見え方を確認できるようにする。
  これは Phase 2 で実認証に置き換える前提の**仮 UI であることを日本語で明示**する。

### クリック数の設計上の裏付け（CLAUDE.md §7）

| 要件 | 実現方法 |
|---|---|
| 続きから学ぶ＝1 クリック | マイページ最上部の継続カードから `/mypage/courses/[slug]/lessons/[id]` へ直リンク |
| 資料まで 2 クリック以内 | マイページ →「資料」→ 一覧に全 PDF（＝2 クリック）。加えて講座カード内にも資料への直リンク |
| 管理 TOP から 2 クリック以内 | ダッシュボードの「クイック操作」4 種＋サイドナビ（常時表示）で全主要機能へ 1〜2 クリック |

---

## 6. コンポーネント設計

3 層に分ける。**下の層は上の層を知らない。**

**① `components/ui/`（意味を持たない汎用部品）**
Button（primary＝深赤 / secondary / ghost）、Card、Tabs、Accordion、Badge、Stat、
ProgressBar、Field、Select、Table、EmptyState、Skeleton、Toast、Sheet（モバイル用ドロワー）、Scroller（横スクロール）

**② `components/brand/`（ブランド表現）**
- `SakuraPetal` — 花びら SVG 1 種。サイズ・不透明度・回転のみ指定可。
- `SectionDivider` — 桜を使った区切り線。
- `PhotoFrame` — **写真プレースホルダ**。素材未確定でも成立させるための中核部品。
  桜のブランド背景＋人物シルエット枠を描画し、`src` を渡すだけで実写真に差し替わる。
  → CLAUDE.md「無機質な灰色四角で終わらせない」「後から簡単に差し替え可能」を両方満たす。
- `Logo`

**③ `components/public/` `components/admin/`（画面固有ブロック）**
Hero、CategoryCard、CourseCard、CourseFilter、PurchaseCard、StickyBuyBar（モバイル固定 CTA）、
CertificateShowcase、InstructorIntro、ContinueLearningCard、MyPageBottomNav ／
AdminSidebar、KpiCard、TodoList、QuickActions、SalesChart、RoleSwitcher

**桜モチーフの使用ルール（実装規約として明文化）**
1 ビューポート内に桜要素は**最大 1 箇所**。不透明度は背景装飾で 0.06 以下。
使ってよい場所は CLAUDE.md §5 の 5 箇所のみ。カード全部に散らさない。

---

## 7. 多言語設計

### UI 文言

`src/messages/{ja,en,ko,zh-TW}.json` を next-intl で読む。**ja を原本**とし、他は ja のキー構造に従う。
管理画面の文言はこの仕組みを通さず**日本語のベタ書き**にする（多言語化しない＝混入事故を構造的に防ぐ）。

### コンテンツ（講座など）のデータ設計

```ts
type Locale = 'ja' | 'en' | 'ko' | 'zh-TW';

// 日本語必須・他は任意 ＝ 型レベルで「ja が原本」を強制する
type Localized<T = string> = { ja: T } & Partial<Record<Exclude<Locale, 'ja'>, T>>;

type TranslationMeta = {
  masterUpdatedAt: string;                       // 日本語原本の更新時刻
  translations: Partial<Record<Exclude<Locale,'ja'>, { updatedAt: string }>>;
};

// 導出ステータス（管理画面に日本語で表示）
// 未翻訳 / 翻訳更新が必要（masterUpdatedAt > translations[l].updatedAt）/ 翻訳済み
```

- **`Localized` 型で ja を必須にする**ことで、「原本が日本語」という CLAUDE.md §4 の原則を
  運用ルールではなく**型で担保**する。
- 翻訳ステータス判定は `lib/i18n/translation-status.ts` に 1 関数として置き、
  Phase 1 では管理画面の講座一覧にバッジ（`翻訳済み` / `翻訳更新が必要` / `未翻訳`）で表示する。
  → Phase 2 以降で翻訳管理画面を作る際、この関数をそのまま使える。
- 表示時に翻訳が無い場合は **ja にフォールバック**する。
- 言語スイッチャー：ヘッダー右上に固定配置。現在の言語を明示し、切替時は同一ページの別ロケールへ遷移。

### 通貨（CLAUDE.md §15）

```ts
type Price = { JPY: number } & Partial<Record<'USD'|'KRW'|'TWD', number>>;  // 最小単位の整数
```
**為替換算で自動生成しない**＝市場ごとの独立価格。ロケール既定の通貨で表示し、管理画面は常に円表示。

---

## 8. デザインシステム案

### トークン（Tailwind 4 の `@theme` に定義）

| トークン | 値 | 用途 |
|---|---|---|
| `--color-bg` | `#FFFFFF` | 基本背景（**最も多く使う**） |
| `--color-surface` | `#FAF8F5` | セクション背景・カード地 |
| `--color-sakura` | `#F1D9DF` | アクセント・図・バッジ |
| `--color-sakura-soft` | `#FAEFF2` | ごく薄い背景装飾 |
| `--color-crimson` | `#8D2633` | **CTA と重要箇所のみ**。面で塗らない |
| `--color-ink` | `#292526` | 本文 |
| `--color-line` | `#E9E3E1` | 境界線 |

> **要承認：** 補助文字色（キャプション・単位・補足）が CLAUDE.md に定義されていない。
> `--color-ink-muted: #6B6361`（ink の淡色）を**追加提案**する。無いと全ての補足文が本文と同じ濃さになり、階層が作れない。
> 勝手に確定せず、承認をいただいてから使用する。

- 角丸：`4px / 8px` の 2 段階のみ（**過剰な丸角を避ける**）
- 影：`0 1px 2px rgba(41,37,38,.06)` の 1 段階のみ。多用しない。境界線で区切ることを優先。
- グラデーション：**使わない**（CLAUDE.md §6 の禁止事項）
- 余白スケール：4 の倍数。セクション間はデスクトップ 80px / モバイル 48px を上限とし、それ以上空けない。

### タイポグラフィ

- 見出し：明朝系（上品・高級感）／本文：ゴシック系（可読性）
- **要確認事項：** 日本語書体は ko / zh-TW の字形を正しく含まない。
  4 言語で破綻させないため、**ロケールごとに書体を出し分ける設計**が必要（ja / ko / zh-TW / ラテンで別ファミリ）。
  具体的な書体は無償ライセンス（SIL OFL 等）を実際に確認してから確定する。**現時点で書体名を決め打ちしない。**
- 見出しサイズ上限：デスクトップ 40px / モバイル 28px（**意味のない巨大フォントを避ける**）

---

## 9. スマートフォン設計（最優先・iPhone Safari が主対象）

| 画面 | モバイル固有の設計 |
|---|---|
| TOP | HERO は縦積み。注目講座は**横スワイプ**。カテゴリは 2 列グリッド |
| 講座一覧 | 絞り込みは**下から出るシート**（Sheet）。一覧は縦だが 10 件以上は「さらに表示」で分割 |
| 講座詳細 | 購入カードは上部に要約 ＋ **画面下部に購入 CTA を固定（StickyBuyBar）**。タブは横スクロール可能なタブバー |
| マイページ | **下部固定ナビ**（ホーム／講座／資料／証明書／アカウント）。最上部に「続きから学ぶ」 |
| 管理画面 | サイドナビは**ドロワー**化。KPI カードは 2×2。表は横スクロール |

**iPhone Safari 固有の実装ルール**

- 高さは `100vh` ではなく **`100dvh`** を使う（アドレスバーで崩れるため）
- `env(safe-area-inset-bottom)` を固定要素の下部パディングに必ず加える
- タップ対象は最小 44×44px
- 入力欄の font-size は 16px 以上（フォーカス時の自動ズーム防止）
- `-webkit-tap-highlight-color` を無効化
- 横スクロール領域に `scroll-snap` を付け、ページ全体は絶対に横スクロールさせない

---

## 10. モックデータ設計（差し替え前提）

### 分離の仕組み（Phase 2 での作り直しを防ぐ最重要部分）

```
lib/data/repositories.ts   … interface CourseRepository { list(...): Promise<Course[]>; ... }
lib/data/mock/*.ts         … モック実装（JSON を返すだけ）
lib/data/index.ts          … env で実装を選ぶ（Phase 1 は mock 固定）
```

**規約：ページ・コンポーネントは `lib/data` からのみ import する。`lib/data/mock` を直接 import しない。**
（ESLint の `no-restricted-imports` でこの規約を機械的に強制する）

- 全リポジトリメソッドは**最初から `Promise` を返す**。Phase 2 で非同期 I/O になっても呼び出し側が変わらないため。
- 型（`types.ts`）は将来の DB スキーマの下敷きになるので、Phase 1 でも真面目に定義する。

### 用意するモック

| 種類 | 件数 | 内容 |
|---|---|---|
| 講師 | 2 | SAKURA（6 カテゴリ）／ TOMOMI（3 カテゴリ） |
| カテゴリ | 9 | CLAUDE.md §13 のとおり |
| 講座 | 12 前後 | 一覧の絞り込み・横スクロール・「10 件以上並べない」検証に足りる数。うち有料 9 / 無料 3、認定対象 2 |
| Lesson | 各講座 4〜8 | 6〜12 分（CLAUDE.md §12） |
| 教材 | 講座ごと | 講義 PDF / Workbook / チェックリスト / 文字起こし / 確認テスト |
| 受講者 | 8 前後 | 管理画面の受講者一覧・進捗用 |
| 証明書 | 3 | 修了証 2 ／ 認定証 1（Certificate ID 付き） |
| 売上 | 直近 30 日＋当月 | ダッシュボード KPI とグラフ用 |
| 今日やること／お問い合わせ | 数件 | 未対応バッジの確認用 |

**モックには「空・エラー・読み込み中」も再現できるようにする**（CLAUDE.md §19 の状態確認のため）。

---

## 11. テスト方法

| # | UX 確認基準 | 確認方法（具体的に） |
|---|---|---|
| 1 | 初見 5 秒で日本発の美容教育サイトと分かる | TOP のファーストビューを 390×844（iPhone）と 1440×900 でスクリーンショットし、**スクロールなしで見える範囲だけ**を評価。ブランド名・「日本」「美容教育」を示す語・SAKURA の人物領域・CTA が全て入っているか |
| 2 | SAKURA がブランドの中心と分かる | 同スクリーンショットで SAKURA の視覚的占有面積が最大か。TOP 内の SAKURA 露出箇所（HERO・紹介ブロック）を確認 |
| 3 | TOP から講座へ迷わず進める | TOP → 講座一覧 → 講座詳細を **2 クリック**で到達できることを Playwright で機械的に検証 |
| 4 | 不要な長スクロールがない | 各ページの総高さを実測し、**TOP はモバイルで 6 画面分以内**を上限として判定 |
| 5 | 「続きから学ぶ」が最優先 | マイページのファーストビュー内に存在し、**1 クリック**でレッスンへ到達することを検証 |
| 6 | 資料へ 2 クリック程度 | マイページ →「資料」で PDF 一覧に到達することを検証（クリック数を数える） |
| 7 | 管理画面ですぐ売上と未対応 | `/admin` のファーストビューに 4 KPI が全て入るか（スクロール不要）を実測 |
| 8 | TOMOMI 画面が簡単 | 役割切替で TOMOMI にし、**ナビ項目数が SAKURA より明確に少ない**こと、システム設定等が表示されないことを確認 |
| 9 | スマホで操作しやすい | 390×844 で全ページを巡回し、**横スクロールが発生しないこと**、タップ対象 44px 以上、固定 CTA がキーボード表示時に隠れないことを確認 |
| 10 | 文字だけのページになっていない | 各ページについて「アイコン／画像領域／カード／数値／状態表示のうち 3 種類以上を使用」を目視＋チェックリストで確認 |

### 機械的に実行するもの

```
npx tsc --noEmit        # 型
npx eslint .            # lint（no-restricted-imports によるデータ層規約違反も検出）
npm run build           # ビルド
npx playwright test     # 全ページ巡回・クリック数検証・スクリーンショット取得
```

- Playwright は**本環境の Chromium（`/opt/pw-browsers/chromium`）を使用**。追加インストール不要。
- 4 ロケール × 主要ページを巡回し、**リンク切れ・未翻訳キー・レイアウト崩れ**を検出する。
- **スクリーンショットを提出物とする。**「表示されました」で終わらせない（CLAUDE.md §3-3）。

---

## 12. Phase 1 の完成条件

以下が**すべて**満たされた時点で Phase 1 完了とする。

**画面**
- [ ] TOP（① HERO ②カテゴリ ③注目講座 ④なぜ日本の美容 ⑤SAKURA ⑥TOMOMI ⑦学ぶ→修了→証明）が仕様どおり
- [ ] 講座一覧／講座詳細（タブ 6 種）／SAKURA 紹介／TOMOMI 紹介／無料コンテンツ／ログイン／新規登録／マイページ骨格
- [ ] SAKURA 管理画面（サイドナビ 12 項目・ダッシュボード KPI 4・今日やること・クイック操作・売上グラフ）
- [ ] TOMOMI 管理画面（簡易版・自分に関係しない項目が非表示）

**品質**
- [ ] §11 の UX 確認基準 10 項目すべてに合格
- [ ] `tsc --noEmit` / `eslint` / `build` がすべてエラー 0
- [ ] 4 ロケールで切替が動作し、未翻訳キーが存在しない
- [ ] 空データ・読み込み中・エラーの 3 状態が全主要画面で確認できる
- [ ] 管理画面に**不要な英語が 1 つも表示されていない**（日付・ステータス・グラフ凡例を含めて目視確認）
- [ ] 390×844 で全ページに横スクロールが発生しない

**構造**
- [ ] ページ／コンポーネントが `lib/data/mock` を直接 import していない（lint で保証）
- [ ] 既存サロンアプリのファイルに変更が入っていない（`git diff` で確認）

---

## 13. 技術的リスク

| ID | リスク | 影響 | 対応 |
|---|---|---|---|
| **R-0** | **git push が 403 で拒否される状態が継続** | **Phase 1 の成果物をリモートに保存できない。この実行環境は一定時間で破棄されるため、実装しても失われる可能性がある** | **実装開始前に必ず解消する。**GitHub App のインストール、または GitHub 再接続が必要（最優先） |
| **R-1** | 既存 `vercel.json` がルートの `index.html` を配信する構成。同じルートに Next.js を置くと衝突する | 稼働中のサロンアプリを壊す恐れ | **別リポジトリを推奨**。同一リポジトリにする場合はサブディレクトリに隔離し、`vercel.json` を変更しない |
| **R-2** | `typescript@latest`（7.0.2）は typescript-eslint 未対応 | lint が動かず完了条件を満たせない | **TS 6.0.3 を採用**（確認済み）。導入直後に `eslint` を実行して実地検証する |
| **R-3** | Tailwind 4 は CSS ファースト設定で `tailwind.config.js` を使わない | 旧来の手順・記事どおりに書くと動かない | 公式手順を実際に確認して導入。設定を推測で書かない |
| **R-4** | ブランド素材（SAKURA 写真・ロゴ）が未提供 | HERO が成立しない | `PhotoFrame` で桜ブランド背景のプレースホルダを実装し、`src` 差し替えのみで完成する構造にする |
| **R-5** | 日本語書体は ko / zh-TW の字形を含まない | 韓国語・繁体字で文字化け・字形崩れ | ロケール別に書体を出し分ける設計。書体はライセンスを確認してから確定 |
| **R-6** | モック → Supabase 差し替え時の作り直し | Phase 2 のコスト増 | リポジトリ層インターフェース＋全メソッド `Promise` 化＋lint による import 制限 |
| **R-7** | ホスティング未確定 | 後から動かない機能が出る | プラットフォーム固有 API を使わない。Phase 1 はローカル確認で完結させる |
| **R-8** | Next.js 16 は本アシスタントの知識時点より新しい | 記憶ベースの記述が誤る可能性 | **実装時は公式ドキュメントを都度確認する。**記憶で API を書かない |

---

## 14. 今の仕様で不足している重要事項（実装前に回答が必要）

### 実装をブロックするもの（これが決まらないと着手できない）

1. **push 権限（R-0）** — 解消の見込み。解消前に実装すると成果物が失われる可能性がある
2. **配置場所（R-1）** — 新規リポジトリ / 既存リポジトリのサブディレクトリ、どちらにするか
3. **補助文字色の追加可否** — `--color-ink-muted: #6B6361` を足してよいか（無いと情報の階層が作れない）

### 画面を作るために必要（仮置きで進めてよければその旨をご指示ください）

4. **サンプル講座の内容** — 講座名・価格・時間をこちらで仮に作ってよいか（実在の商品名を使うべきか）
5. **難易度の区分** — 講座一覧の絞り込み条件。「初級／中級／上級」でよいか
6. **無料コンテンツの定義** — 無料講座なのか、記事・動画なのか。TOP の CTA「無料で学ぶ」の遷移先
7. **対応通貨** — 表示する通貨（USD / KRW / TWD を想定してよいか）
8. **レビュー** — 講座詳細のレビュータブは Phase 1 でモック表示するか、非表示にするか
9. **サイト名の正式表記** — 「SAKURA JAPAN BEAUTY」で確定か。日本語表記の併記は必要か
10. **ログイン方式** — メール＋パスワードのみか、SNS ログインも想定した UI にするか

### Phase 1 の範囲確認

11. **証明ページ（`/verify/[certificateId]`）** — CLAUDE.md §11 にあるが Phase 1 のページ一覧には未記載。含めるか
12. **レッスン視聴画面** — 「続きから学ぶ」の遷移先。Phase 1 では動画なしの骨格のみ作るか、リンクだけにするか

---

## 承認をお願いしたいこと

この計画で進めてよいか、上記 14 章の**1〜3（ブロッカー）**への回答をいただければ Phase 1 の実装に着手します。
4 以降は「こちらで仮置き」で進めてよければ、その旨だけご指示ください。
