# URL Summerizer

URLを入力すると内容をスクレイピングして日本語で要約を表示するWebアプリケーション

[![GitHub Action Status](https://github.com/ユーザー名/url-summerizer/workflows/Deploy%20URL%20Summerizer/badge.svg)](https://github.com/ユーザー名/url-summerizer/actions)

## プロジェクト概要

- **目的**: Webページの内容を自動的にスクレイピングし、日本語で簡潔に要約
- **URL**: https://summery.minoruonda.com/
- **AWS略称**: usm

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js
- **UI**: shadcn/UI（ホワイト基調、ターコイズアクセント）
- **状態管理**: React Hooks

### バックエンド
- **フレームワーク**: Mastra
- **スクレイピングツール**: Firecrawl API（直接呼び出し）
- **LLM**: AWS Bedrock Claude 3.7（USクロスリージョン推論）

### インフラストラクチャ
- **IaC**: AWS CDK
- **認証**: AWS Cognito
- **監視**: Langfuse Cloud
- **デプロイ**: AWS CloudFront + S3

## アーキテクチャ

```
ユーザー → CloudFront → S3(フロントエンド) 
                      → API Gateway → Lambda → Firecrawl/Bedrock
                      → Cognito(認証)
```

## 機能

- URLの入力と検証
- Webコンテンツのスクレイピング
- 日本語による要約生成
- 処理ステータスのリアルタイム表示
- ユーザー認証（Cognito）

## ディレクトリ構造

```
url-summerizer/
├── README.md
├── frontend/              # Next.jsフロントエンド
│   ├── src/
│   │   ├── app/           # ページ
│   │   ├── components/    # UIコンポーネント
│   │   └── lib/           # ユーティリティ
├── backend/               # バックエンド関連
│   └── lambda/            # Lambda関数
└── infra/                 # AWS CDK
    ├── bin/
    └── lib/
```

## ローカル環境構築

```bash
# フロントエンド開発サーバー起動
cd frontend
npm install
npm run dev
```

## 環境変数

```
# frontend/.env.local
NEXT_PUBLIC_API_URL=xxx
NEXT_PUBLIC_COGNITO_USER_POOL_ID=xxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxx
```

## 環境構成

プロジェクトは開発環境(dev)と本番環境(prod)の2つの環境で構成されています。

- **開発環境(dev)**:
  - 機能開発とテスト用
  - `dev`ブランチからデプロイ
  - 開発者がテストや機能確認に使用

- **本番環境(prod)**:
  - 実際のユーザーが使用する環境
  - `main`ブランチからデプロイ
  - 安定性と信頼性を重視

### AWS構成

- **リージョン**: 
  - us-west-2 (オレゴン): メインインフラ
  - us-west-2 (オレゴン): Bedrock推論

- **デプロイプロファイル**: sandbox

## デプロイ方法

### GitHub Actionsによる自動デプロイ

1. コードをプッシュするとGitHub Actionsが自動的に実行されます
   - `dev`ブランチへのプッシュ → 開発環境へデプロイ
   - `main`ブランチへのプッシュ → 本番環境へデプロイ

2. 手動でデプロイを実行する場合:
   - GitHubリポジトリの「Actions」タブで「Deploy URL Summerizer」ワークフローを選択
   - 「Run workflow」ボタンをクリック
   - デプロイ先環境を選択（dev/prod）
   - 「Run workflow」をクリック

詳細なデプロイ手順については、[DEPLOY_INSTRUCTIONS.md](./DEPLOY_INSTRUCTIONS.md)を参照してください。

### デプロイ後の設定

デプロイが完了すると、以下の情報がGitHub Actionsのログに出力されます：

- Cognito User Pool ID
- Cognito User Pool Client ID
- API Gateway URL
- CloudFront Domain Name

これらの情報をGitHubの環境変数として設定する必要があります：

1. リポジトリの「Settings」→「Environments」→環境を選択
2. 「Environment variables」セクションで以下を設定（Variables）：
   - `COGNITO_USER_POOL_ID`
   - `COGNITO_CLIENT_ID`
   - `API_URL`
   - `FIRECRAWL_API_ENDPOINT`: `https://api.firecrawl.dev/v1/scrape`
   - `CLOUDFRONT_DISTRIBUTION_ID`
   - `CLOUDFRONT_DOMAIN_NAME`

3. 「Environment secrets」セクションで以下を設定（Secrets）：
   - `FIRECRAWL_API_KEY`: Firecrawlから取得したAPIキー
   - `LANGFUSE_SECRET_KEY`
   - `LANGFUSE_PUBLIC_KEY`
   - `LANGFUSE_HOST`

## 環境変数の管理

開発環境と本番環境それぞれに必要な環境変数を`.env.dev`と`.env.prod`として準備します。
テンプレートは`.env.template`を参照してください。

```bash
# 環境変数ファイルのコピー
cp .env.template .env.dev
cp .env.template .env.prod

# 各環境に合わせて値を編集
```
