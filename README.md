# URL Summerizer

URL内容の要約アプリケーション

## デプロイ手順

### 前提条件

1. AWS CLIがインストールされていること
2. AWS認証情報が設定されていること
3. Node.jsとnpmがインストールされていること

### バックエンドのデプロイ

```bash
# backendディレクトリで依存パッケージをインストール
cd backend
npm install

# infraディレクトリでCDKをデプロイ
cd ../infra
npm install
npx cdk deploy
```

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

## mastraパッケージがない場合のエラー

Lambda関数で「Cannot find module 'mastra'」エラーが発生した場合：

1. backendディレクトリでnpm installを実行してから、CDKをデプロイしてください

```bash
cd backend
npm install
cd ../infra
npx cdk deploy
```

2. これはLambda関数がnode_modulesディレクトリ内のmastraパッケージを見つけられないために発生します
