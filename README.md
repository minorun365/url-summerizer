# URL Summerizer

URL内容の要約アプリケーション

## アーキテクチャ

このアプリケーションは、以下のコンポーネントで構成されています：

- フロントエンド: Next.js（静的サイト、CloudFrontとS3でホスティング）
- バックエンド: AWS Lambda + API Gateway
- 認証: Amazon Cognito

## デプロイ手順

### 前提条件

1. AWS CLIがインストールされていること
2. AWS認証情報が設定されていること
3. Node.jsとnpmがインストールされていること

### ローカルでのデプロイ

```bash
# Lambda Layersの依存関係をインストール
cd lambda-layers/mastra/nodejs
npm install --production

cd ../../utils/nodejs
npm install --production

# infraディレクトリでCDKをデプロイ
cd ../../infra
npm install
npx cdk deploy
```

### GitHub Actionsによる自動デプロイ

このリポジトリには、GitHub Actionsのワークフロー設定が含まれています。`main`または`dev`ブランチにプッシュすると、自動的にデプロイが実行されます。

## AWS Lambda Layers

このプロジェクトでは、Lambda関数のサイズを最適化するためにLambda Layersを使用しています。

### レイヤー構造

```
lambda-layers/
  ├── minimal-mastra/   # mastraフレームワークの最小限の必要ファイルのみ
  │   └── nodejs/
  │       ├── package.json
  │       └── node_modules/
  │           └── mastra/
  │               ├── package.json
  │               └── dist/
  │                   └── index.js
  │
  └── utils/            # その他ユーティリティ（Axios、AWS SDK等）
      └── nodejs/
          ├── package.json
          └── node_modules/
              ├── axios/
              ├── form-data/
              └── @aws-sdk/
```

### 最小限レイヤーの利用

mastraパッケージ全体が大きすぎる（250MB超の可能性）ため、必要最小限のファイルだけを含むカスタムレイヤーを作成しています：

1. **必要なファイルのみの抽出**：
   - `index.js`（メインエントリーポイント）
   - `package.json`（バージョン情報）
   - 必須の依存関係のみ

2. **デプロイのカスタマイズ**：
   - GitHub Actionsで自動的に必要なファイルだけをコピー
   - サイズを小さく保ち、Lambda関数のサイズ制限を回避

### レイヤーの利点

- **サイズ制限の克服**: Lambda関数本体のサイズを縮小し、250MBの制限を回避
- **依存関係の共有**: 複数のLambda関数間で依存関係を共有することが可能
- **デプロイ時間の短縮**: コード変更時のみデプロイすればよく、依存関係のレイヤーは再利用可能

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
