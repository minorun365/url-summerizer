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

### 3. 環境変数の設定

1. GitHubリポジトリの「Settings」→「Secrets and variables」→「Actions」に移動します

2. 以下の環境変数をリポジトリシークレットとして追加します:
   - `AWS_ROLE_ARN`: 作成したIAMロールのARN
   - `AWS_REGION`: `us-west-2`（オレゴンリージョン）
   - `FIRECRAWL_MCP_ENDPOINT`: Firecrawl MCPエンドポイント
   - `LANGFUSE_API_KEY`: Langfuse APIキー（オプション）

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

1. リポジトリの「Actions」タブをクリックします
2. 「Deploy URL Summerizer」ワークフローが表示されます
3. 「Run workflow」ボタンをクリックし、手動でワークフローを実行します
4. デプロイの進行状況が表示されます

デプロイが完了すると、GitHubの「Actions」タブのワークフローログに以下のような出力が表示されます:
- Cognito User Pool ID
- Cognito User Pool Client ID
- API Gateway URL
- CloudFront Domain Name

これらの値を控えておき、フロントエンドの環境変数として設定します。

### 6. フロントエンド設定の更新

1. AWSデプロイで取得した情報をもとに、次の環境変数を更新します
   ```
   NEXT_PUBLIC_API_URL=https://xxxx.execute-api.us-west-2.amazonaws.com/prod/
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-west-2_xxxxx
   NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxx
   ```

2. 更新した環境変数をGitHubリポジトリのシークレットに追加します

3. 再度ワークフローを実行してデプロイします

### 7. カスタムドメイン設定（オプション）

1. Route 53のminoruonda.comドメイン内に`summery.minoruonda.com`サブドメインを作成します
2. CloudFrontのディストリビューションにカスタムドメインを設定します
3. SSL証明書を設定します

## トラブルシューティング

デプロイに問題がある場合は、以下を確認してください:

1. IAMロールの信頼関係が正しく設定されているか
2. GitHubシークレットが正しく設定されているか
3. AWS CDKブートストラップが正常に実行されたか

## メンテナンス

- アプリケーションの更新は、コードをGitHubリポジトリにプッシュすることで自動的にデプロイされます
- 環境変数の変更は、GitHubリポジトリのシークレットを更新してから再デプロイすることで適用されます
