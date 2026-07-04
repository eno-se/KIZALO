# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 開発ワークフロー

**方針提示 → ユーザーからのGOメッセージ → 実装 → ローカル確認 → ユーザーOK → コミット・プッシュ** の順番を必ず守る。
- 実装前に方針（何をどう作るか）をテキストで提示し、ユーザーからの返信を待つ
- ユーザーが「OK」「やって」「進めて」などのGOメッセージを送ってきたら実装を開始する
- 実装が完了しても、ユーザーがローカルで確認してOKを出すまでコミット・プッシュしない

## Commands

```bash
npm run dev      # 開発サーバー起動（--webpack フラグ付き、必須）
npm run build    # 本番ビルド
npm run lint     # ESLint

# Prisma
npx prisma migrate dev --name <name>   # マイグレーション作成・適用
npx prisma generate                    # クライアント再生成
npx prisma studio                      # DB GUI

# スクリプト実行（prisma/ 配下の seed ファイル）
npx ts-node --esm prisma/seed.ts
```

## Prisma v7 の必須ルール

**`schema.prisma` の `datasource` に `url` を書いてはいけない。** `prisma.config.ts` で管理する。

```ts
// prisma.config.ts — DATABASE_URL はここで読む
export default defineConfig({
  datasource: { url: process.env["DATABASE_URL"] },
});
```

PrismaClient のインスタンス化は `PrismaPg` アダプター経由が必須:

```ts
import { PrismaPg } from "@prisma/adapter-pg";
new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
```

生成クライアントのインポートパスは `@/app/generated/prisma/client`（`@prisma/client` ではない）。

## アーキテクチャ概要

### ユーザー種別

全ユーザーは `User` モデルで統一。`CreatorProfile` を持つユーザーが「推し（クリエイター）」、持たないユーザーが「ファン」として機能する。ファン→クリエイター関係は `FanFollow` で管理。

### 日付管理

`Kizari.date` は `String` 型（`"YYYY-MM-DD"`）で JST 基準。`DateTime` ではない。日付操作は必ず `lib/jst.ts` の `getJstDateString()` / `getJstYesterdayString()` を使う。

### 認証フロー

- NextAuth v5 beta + Google OAuth
- ミドルウェアファイル名は `proxy.ts`（`middleware.ts` ではない）
- `session.user.id` は `lib/auth.ts` の `callbacks.session` で追加済み
- 開発用ログイン: `POST /api/dev-login` → `{ userId }` を送るとセッションCookieが設定される（`NODE_ENV === "development"` 限定）

### Server Actions パターン

`app/actions/` 配下に集約。先頭で必ず `await auth()` してセッション確認。DB操作後は関連パスを `revalidatePath` する。

### アイコン画像アップロードフロー

1. `POST /api/upload-icon` → `{ presignedUrl, publicUrl }` を返す
2. クライアントが `PUT presignedUrl` でファイルを直接 R2 へアップロード
3. `publicUrl` を DB に保存（`updateCreatorProfile` Server Action）
4. プロフィール更新時、古いアイコンは R2 から自動削除される

### レイアウト構造

`layout.tsx` が Header（fixed top）と BottomNav（fixed bottom）を持つ。本文ラッパーは `pt-14 pb-16`。BottomNav と重なるコンテンツがあるページは `pb-28` を追加する。

## デザインシステム

Tailwind v4: 設定ファイルなし、`globals.css` に `@import "tailwindcss"` のみ。カスタムユーティリティもすべて `globals.css` で定義。

| クラス | 用途 |
|---|---|
| `glass-card` | ホワイト系液体ガラスカード |
| `glass-btn-primary` | ピンク→ラベンダー→スカイのグラデーションボタン |
| `glass-btn-secondary` | フロストガラスボタン |
| `name-chip` | ファン名チップ |
| `brand-gradient-text` | グラデーションテキスト |
| `sparkle` | スパークルアイコン（マスク使用） |

`LiquidGlassFilter` コンポーネント（`layout.tsx` に配置）が SVG `#lg-filter` を提供。Chrome の `feDisplacementMap` 屈折エフェクトに使用。`.supports-liquid-glass` クラスで有効化。

ブランドカラー: pink `#F58BCB` → lavender `#B98AF5` → sky `#7DB7FF`

## 環境変数

```
DATABASE_URL           # Railway PostgreSQL（.env.local）
AUTH_SECRET            # NextAuth シークレット
AUTH_GOOGLE_ID         # Google OAuth クライアントID
AUTH_GOOGLE_SECRET     # Google OAuth シークレット
NEXTAUTH_URL           # http://localhost:3000（本番は https://...）
R2_ACCOUNT_ID          # Cloudflare アカウントID
R2_ACCESS_KEY_ID       # R2 APIトークン
R2_SECRET_ACCESS_KEY   # R2 APIトークン
R2_BUCKET_NAME         # R2 バケット名
R2_PUBLIC_URL          # R2 パブリックURL（https://pub-xxx.r2.dev）
```

`.env` は Prisma CLI 用（`prisma.config.ts` が読む）、`.env.local` は Next.js サーバー用。両方に `DATABASE_URL` が必要。

## Next.js 16 の注意点

- `useSearchParams()` は `<Suspense>` ラッパーが必須
- `params` は Promise: `const { slug } = await params`
- `next.config.ts` の `remotePatterns` に R2 公開ドメインと `lh3.googleusercontent.com`（Google アバター）が登録済み
