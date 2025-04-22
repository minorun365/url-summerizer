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
# npm workspacesを使って依存関係をインストール
cd backend
npm install --workspaces --production

# infraディレクトリでCDKをデプロイ
cd ../infra
npm install
npx cdk deploy
```

### GitHub Actionsによる自動デプロイ

このリポジトリには、GitHub Actionsのワークフロー設定が含まれています。`main`または`dev`ブランチにプッシュすると、自動的にデプロイが実行されます。

## npm workspacesを活用したLambda Layers

このプロジェクトでは、Lambda関数のサイズを最適化するためにLambda LayersとnpmのWorkspaces機能を組み合わせて使用しています。

### ワークスペース構造

```
backend/
├── package.json (workspacesルート)
├── lambda/      (Lambda関数コード)
│   └── package.json
└── layers/
    ├── mastra-core/   (mastraパッケージ本体)
    │   └── nodejs/
    │       └── package.json
    └── mastra-deps/   (mastraの依存パッケージ)
        └── nodejs/
            └── package.json
```

### レイヤー構成の特長

```
Lambda関数
│
├── mastra-coreレイヤー
│   └── nodejs/
│       └── node_modules/
│           └── mastra/
│               ├── package.json
│               └── dist/
│                   ├── index.js
│                   └── ...
│
├── mastra-depsレイヤー
│   └── nodejs/
│       └── node_modules/
│           ├── commander/
│           └── @huggingface/
│
└── utilsレイヤー
    └── nodejs/
        └── node_modules/
            ├── axios/
            ├── form-data/
            └── @aws-sdk/
```

### npm workspacesを活用する利点

1. **依存関係管理の簡素化**:
   - 単一のコマンド(`npm install --workspaces`)で全ての依存関係をインストール可能
   - 各レイヤーの依存関係が個別に管理され、クリーンな構造を維持

2. **サイズ制限の回避**:
   - 依存関係を複数のレイヤーに分散し、各レイヤーを50MB以下に保つ
   - mastraコアとその依存関係を分離することで、複雑な依存関係チェーンを適切に処理

3. **ESモジュールの依存解決**:
   - commanderなどのESモジュールの依存関係を明示的に含めることで、実行時のエラーを防止

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

## その他の依存関係問題

依存パッケージが見つからないエラー（例: commander）が発生した場合：

```
Cannot find package 'commander' imported from /opt/nodejs/node_modules/mastra/dist/index.js
```

このような場合は、以下の対処が必要です：

1. 必要な依存パッケージを `backend/layers/mastra-deps/package.json` に追加
2. `npm install --workspaces --production` を実行して依存関係を更新
3. レイヤー構造を確認し、必要なパッケージが正しくインストールされているか確認
