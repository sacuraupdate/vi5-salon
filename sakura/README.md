# SAKURA JAPAN BEAUTY

日本の美容サロンの技術・接客・経営を、海外の美容従事者へ販売するオンライン教育プラットフォーム。

プロジェクトの恒久ルールは、**リポジトリルートの `CLAUDE.md`** を参照してください。
Phase 1 の実装計画は `../docs/phase-1-plan.md` にあります。

> このディレクトリはリポジトリルートの既存サロン予約アプリ（`../index.html` 等）とは**別のプロダクト**です。
> ルートの既存ファイルは変更しないでください。

## 開発

```bash
npm install
npm run dev          # http://localhost:3000
```

| コマンド | 内容 |
|---|---|
| `npm run typecheck` | 型チェック（tsc --noEmit） |
| `npm run lint` | ESLint |
| `npm run build` | 本番ビルド |
| `npm run shots` | 主要ルートを iPhone / タブレット / デスクトップで開き、横スクロール・ページ高さ・コンソールエラーを検査してスクリーンショットを保存 |
| `npm run ux-check` | クリック数・言語切替・購入CTA・権限差・管理画面の日本語化を実操作で検査 |

`shots` / `ux-check` は `npm run dev` を起動した状態で実行してください。

## 構成

```
src/
  app/(site)/[locale]/   購入者向け（ja / en / ko / zh-TW）
  app/(admin)/admin/     管理画面（多言語化しない＝常に日本語）
  components/ui/         意味を持たない汎用部品
  components/brand/      桜モチーフ・ロゴ・写真プレースホルダ
  components/public/     購入者向け画面の部品
  components/admin/      管理画面の部品
  lib/data/              ★データ層
    types.ts             ドメイン型
    repositories.ts      インターフェース（画面が依存する唯一の契約）
    mock/                Phase 1 のモック実装
    index.ts             実装の切り替え
  i18n/                  ルーティング・リクエスト設定
  messages/              UI文言（ja が原本）
```

### データ層のルール

画面は **`@/lib/data` からのみ** データを取得します。`@/lib/data/mock` を直接 import することは
ESLint (`no-restricted-imports`) で禁止しています。Phase 2 で Supabase 実装へ差し替える際、
`src/lib/data/index.ts` の分岐に実装を足すだけで済むようにするためです。

### 多言語

- 日本語(`ja`)が原本。`Localized` 型は `ja` を必須にして、型レベルで原本を強制しています。
- 翻訳の鮮度は `translationStatus()` が判定し、管理画面に「翻訳済み／翻訳更新が必要／未翻訳」で表示します。
- 管理画面は多言語化しません。ルーティング上も `[locale]` の外に置いています。
