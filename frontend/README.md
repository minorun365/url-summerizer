# URL Summerizer フロントエンド

URLを入力すると内容をスクレイピングして日本語で要約を表示するWebアプリケーションのフロントエンドです。

この[Next.js](https://nextjs.org)プロジェクトは[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)で作成されています。

## 開発環境構築

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 環境設定

Next.jsアプリケーションは環境変数によって設定が可能です：

### 開発環境

開発環境用の環境変数は`.env.dev`ファイルに定義されています：

```bash
# 開発環境の環境変数を読み込んで開発サーバー起動
cp .env.dev .env.local
npm run dev
```

### 本番環境

本番環境用の環境変数は`.env.prod`ファイルに定義されています：

```bash
# 本番環境の環境変数を使用してビルド
cp .env.prod .env.local
npm run build
npm run start
```

### 環境変数の設定

以下の環境変数が必要です：

- `NEXT_PUBLIC_API_URL`: バックエンドAPIのエンドポイントURL
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID`: AWS Cognito User Pool ID
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`: AWS Cognito Client ID

## デプロイ

このプロジェクトはAWS CloudFront + S3にデプロイされます。
デプロイはGitHub Actionsを通じて自動化されています：

- `dev`ブランチへのプッシュ → 開発環境へデプロイ
- `main`ブランチへのプッシュ → 本番環境へデプロイ

詳細なデプロイ手順については、プロジェクトルートの[DEPLOY_INSTRUCTIONS.md](../DEPLOY_INSTRUCTIONS.md)を参照してください。
