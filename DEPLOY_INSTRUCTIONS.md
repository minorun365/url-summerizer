# URL Summerizerデプロイ手順

このドキュメントでは、URL SummerizerアプリケーションをAWSにデプロイする手順を説明します。GitHub ActionsとAWSのOIDC連携を使用して、セキュアなデプロイを実現します。

## 前提条件

1. AWS CLIがインストールされていること
2. GitHubアカウントがあること
3. Langfuse APIキーがあること（オプション）

## デプロイ手順

### 1. GitHubリポジトリの作成

1. GitHubで新しいリポジトリを作成します
   - リポジトリ名: `url-summerizer`
   - 説明: URLを入力すると内容をスクレイピングして日本語で要約してくれるWebアプリ
   - アクセス権: Private（推奨）またはPublic

2. ローカルリポジトリをリモートリポジトリに接続します
   ```bash
   git remote add origin https://github.com/ユーザー名/url-summerizer.git
   git branch -M main
   git push -u origin main
   ```

### 2. AWSとGitHub Actionsのセットアップ（OIDC連携）

1. AWSコンソールでIAM Identity Providerの設定
   - IAMコンソールで「IDプロバイダー」を選択
   - 「プロバイダーの追加」をクリック
   - プロバイダータイプ：「OpenID Connect」を選択
   - プロバイダーURL：`https://token.actions.githubusercontent.com`
   - 対象者：`sts.amazonaws.com`

2. GitHub ActionsがAWSリソースにアクセスするためのIAMロールを作成
   - ポリシー：`AdministratorAccess`（開発用、本番環境では最小権限を付与）
   - 信頼関係：
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::アカウントID:oidc-provider/token.actions.githubusercontent.com"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
             "token.actions.githubusercontent.com:sub": "repo:ユーザー名/url-summerizer:ref:refs/heads/main"
           }
         }
       }
     ]
   }
   ```

3. 作成したロールのARNをメモしておきます

### 3. GitHub Environmentsの設定

1. GitHubリポジトリの「Settings」→「Environments」に移動します

2. 以下の2つの環境を作成します:
   - `dev`: 開発環境（devブランチからデプロイ）
   - `prod`: 本番環境（mainブランチからデプロイ）

3. 各環境ごとに以下の環境変数とシークレットを設定します:

   **共通のシークレット**:
   - `AWS_ROLE_ARN`: 作成したIAMロールのARN

   **環境ごとのシークレットと変数**:
   - `LANGFUSE_SECRET_KEY`: Langfuse シークレットキー
   - `LANGFUSE_PUBLIC_KEY`: Langfuse 公開キー
   - `LANGFUSE_HOST`: Langfuse ホスト（EU: https://cloud.langfuse.com または US: https://us.cloud.langfuse.com）
   - `API_URL`: APIゲートウェイのURL（デプロイ後に設定）
   - `COGNITO_USER_POOL_ID`: Cognitoユーザープールのプールタイプ（デプロイ後に設定）
   - `COGNITO_CLIENT_ID`: Cognitoユーザープールのクライアントタイプ（デプロイ後に設定）

4. 環境保護ルールを設定:
   - 開発環境(`dev`)：必要に応じて設定
   - 本番環境(`prod`)：デプロイ前に承認を要求する設定を推奨
     - 「Settings」→「Environments」→「prod」→「Required reviewers」を有効化し、レビュアーを追加

### 4. GitHub Actionsワークフローの更新

1. `.github/workflows/deploy.yml`を開き、AWS認証部分を以下のように更新:
   ```yaml
   - name: Configure AWS credentials
     uses: aws-actions/configure-aws-credentials@v4
     with:
       role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
       aws-region: ${{ env.AWS_REGION }}
   ```

2. 変更をコミットし、プッシュします

### 5. AWSデプロイの実行

#### 自動デプロイ（推奨）
1. コードをリモートリポジトリにプッシュすると、GitHub Actionsが自動的に実行されます
   - `dev`ブランチへのプッシュ → 開発環境へデプロイ
   - `main`ブランチへのプッシュ → 本番環境へデプロイ

#### 手動デプロイ
1. リポジトリの「Actions」タブをクリックします
2. 「Deploy URL Summerizer」ワークフローが表示されます
3. 「Run workflow」ボタンをクリックします
4. デプロイ先環境（`dev`または`prod`）を選択します
5. 「Run workflow」ボタンをクリックしてデプロイを開始します
6. デプロイの進行状況が表示されます

#### デプロイ出力の確認
デプロイが完了すると、GitHubの「Actions」タブのワークフローログに以下のような出力が表示されます:
- Cognito User Pool ID
- Cognito User Pool Client ID
- API Gateway URL
- CloudFront Domain Name

これらの値を控えておき、フロントエンドの環境変数として設定します。

### 6. フロントエンド設定の更新

1. AWSデプロイで取得した情報をもとに、次の環境変数を対応する環境ファイルに更新します

   **開発環境の場合（.env.dev）**:
   ```
   NEXT_PUBLIC_API_URL=https://xxxx.execute-api.us-west-2.amazonaws.com/dev/
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-west-2_xxxxx
   NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxx
   ```

   **本番環境の場合（.env.prod）**:
   ```
   NEXT_PUBLIC_API_URL=https://xxxx.execute-api.us-west-2.amazonaws.com/prod/
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-west-2_xxxxx
   NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxx
   ```

2. 更新した環境変数を対応するGitHub Environmentsのシークレットに追加します:
   - 開発環境: `dev`環境のシークレットに追加
   - 本番環境: `prod`環境のシークレットに追加

3. 必要であれば再度ワークフローを実行してデプロイします

### 7. カスタムドメイン設定（オプション）

1. Route 53のminoruonda.comドメイン内に`summery.minoruonda.com`サブドメインを作成します
2. CloudFrontのディストリビューションにカスタムドメインを設定します
3. SSL証明書を設定します

## トラブルシューティング

デプロイに問題がある場合は、以下を確認してください:

1. IAMロールの信頼関係が正しく設定されているか
2. GitHubシークレットが正しく設定されているか
3. AWS CDKブートストラップが正常に実行されたか

## メンテナンスとワークフロー

### 開発ワークフロー
1. `dev`ブランチで開発作業を行います
2. コードを`dev`ブランチにコミット・プッシュすると開発環境に自動デプロイされます
3. 開発環境でテストと確認を行います
4. 機能が安定したら`main`ブランチにマージ（プルリクエスト推奨）

### デプロイとメンテナンス
- 開発環境の更新: `dev`ブランチにプッシュするだけで自動デプロイ
- 本番環境の更新: `main`ブランチにマージするか、手動でワークフローを実行
- 環境変数の変更: GitHub Environmentsのシークレットを更新してから再デプロイ

### 環境間の設定の同期
開発環境と本番環境で同じような変更を適用する場合は、以下の手順で効率的に作業できます：
1. 開発環境で変更をテスト
2. プルリクエストを作成してコードレビュー
3. `main`ブランチにマージして本番環境にデプロイ
4. 各環境のGitHub Environmentsの設定を同期
