# URL Summerizer

URLを入力すると内容をスクレイピングして日本語で要約を表示するWebアプリケーション

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
- **スクレイピングツール**: Firecrawl
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

## AWS構成

- **リージョン**: 
  - us-west-2 (オレゴン): メインインフラ
  - us-west-2 (オレゴン): Bedrock推論

- **デプロイプロファイル**: sandbox
