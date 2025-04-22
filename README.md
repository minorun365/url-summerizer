# URL Summerizer

URL内容の要約アプリケーション

## アーキテクチャ

このアプリケーションは、以下のコンポーネントで構成されています：

- フロントエンド: Next.js（静的サイト、CloudFrontとS3でホスティング）
- バックエンド: AWS Lambda（Docker）+ API Gateway
- 認証: Amazon Cognito

## Docker Lambdaについて

このプロジェクトでは依存関係の複雑さとサイズ制限の問題を解決するため、Docker Lambdaアプローチを採用しています。

### Docker Lambdaの利点

1. **サイズ制限の大幅緩和**
   - 通常のLambdaは解凍後250MB制限
   - Docker LambdaはOCIイメージで10GB制限（容量の拡大）

2. **依存関係の完全な制御**
   - ESモジュール（mastraパッケージなど）の互換性問題を解決
   - コンテナ内にすべての依存関係を含めることが可能

3. **環境の一貫性**
   - 開発環境と本番環境の一致性確保
   - システムライブラリも必要に応じて含められる

### Docker Lambda実装構造

```
Dockerfile
└── Lambda関数
    ├── package.json (依存関係定義)
    ├── npm modules (mastra, axios, etc.)
    └── Lambda関数コード
        ├── index.js
        ├── scraping.js
        └── summarize.js
```

## デプロイ手順

### 前提条件

1. AWS CLIがインストールされていること
2. AWS認証情報が設定されていること
3. Node.jsとnpmがインストールされていること
4. Dockerがインストールされていること

### ローカルでのデプロイ

```bash
# Dockerイメージをビルド
docker buildx build --platform linux/amd64 -t url-summerizer-lambda:latest .

# infraディレクトリでCDKをデプロイ
cd infra
npm install
npx cdk deploy
```

### GitHub Actionsによる自動デプロイ

このリポジトリには、GitHub Actionsのワークフロー設定が含まれています。`main`または`dev`ブランチにプッシュすると、自動的にデプロイが実行されます。

## CORS問題が発生した場合の対処方法

CORS（Cross-Origin Resource Sharing）エラーが発生した場合は、以下の対処法を試してください：

1. **バックエンド側のCORS設定が正しくされているか確認**
   - Lambda関数内のCORSヘッダー設定がすべてのレスポンスで一貫しているか
   - APIゲートウェイのCORS設定が有効になっているか

2. **環境変数の確認**
   - `ALLOWED_ORIGIN`環境変数が正しく設定されているか

3. **フロントエンドからのリクエスト設定**
   - フロントエンドのfetch設定で、credentials: 'include'を使用していないか
   - credentials: 'include'とAccess-Control-Allow-Origin: '*'は共存できないため、どちらかを変更する必要があります

4. **デバッグのためのLambda関数エラーログ確認**
   - CloudWatch Logsでエラーメッセージを確認する

## ES Moduleのインポート問題

Lambda関数内でのESモジュール（例：mastra）のインポートエラーが発生した場合：

```
require() of ES Module /var/task/node_modules/mastra/dist/index.js not supported.
Instead change the require of /var/task/node_modules/mastra/dist/index.js to a dynamic import()
```

対策として動的インポートを使用してください：

```javascript
// 修正前
const { Agent, createTool } = require('mastra');

// 修正後
const { Agent, createTool } = await import('mastra');
```

この問題はDocker Lambdaを使用することでより確実に解決できます。Dockerコンテナ内ではESモジュールの依存関係が正しく処理されるため、import/requireの問題を回避できます。
