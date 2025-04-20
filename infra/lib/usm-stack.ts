import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

// URL Summerizerのスタック定義
export interface UsmStackProps extends cdk.StackProps {
  envName: string;
  stackName?: string;
  description?: string;
  env?: {
    account?: string;
    region?: string;
  };
  crossRegionReferences?: boolean;
}

export class UsmStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: UsmStackProps) {
    super(scope, id, props);

    // 環境名
    const envName = props.envName;
    
    // ------------------------------------
    // Cognito - ユーザー認証
    // ------------------------------------
    // ユーザープール
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `usm-users-${envName}`,
      selfSignUpEnabled: true,
      // ユーザー名（メールアドレスをユーザー名として使用）
      signInAliases: {
        email: true,
      },
      // サインイン時に必要な情報
      requiredAttributes: {
        email: true,
      },
      // パスワードポリシー
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      // 検証メール設定
      autoVerify: { email: true },
      // メールの設定
      email: cognito.UserPoolEmail.withCognito(),
      // カスタム属性
      customAttributes: {
        // 同意フラグ
        hasConsented: new cognito.BooleanAttribute({ mutable: true }),
      },
    });

    // アプリクライアント
    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
      // コールバックURLs（アプリのURLに適宜変更）
      oAuth: {
        callbackUrls: [`https://summery.minoruonda.com/auth/callback`],
        logoutUrls: [`https://summery.minoruonda.com/`],
      },
    });

    // ------------------------------------
    // S3 - フロントエンドデプロイ
    // ------------------------------------
    // フロントエンド用のS3バケット
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `usm-frontend-${envName}-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発用設定（本番環境ではRETAIN推奨）
      autoDeleteObjects: true, // 開発用設定（本番環境では無効化推奨）
    });

    // CloudFrontディストリビューション（CDN）
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      // SPAのルーティング用にindex.htmlにフォールバック
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // CloudFront関連のセキュリティヘッダーを設定
    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeadersPolicy', {
      responseHeadersPolicyName: `usm-security-headers-${envName}`,
      securityHeadersBehavior: {
        contentSecurityPolicy: {
          contentSecurityPolicy: "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
          override: true,
        },
        strictTransportSecurity: {
          accessControlMaxAge: cdk.Duration.days(365 * 2), // 2年間
          includeSubdomains: true,
          override: true,
        },
        contentTypeOptions: {
          override: true,
        },
        frameOptions: {
          frameOption: cloudfront.HeadersFrameOption.DENY,
          override: true,
        },
        xssProtection: {
          protection: true,
          modeBlock: true,
          override: true,
        },
      },
    });

    // ------------------------------------
    // Lambda - バックエンド
    // ------------------------------------
    // APIハンドラーのLambda関数
    const apiHandler = new lambda.Function(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/lambda')),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        // 環境変数
        NODE_ENV: envName,
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
        FIRECRAWL_MCP_ENDPOINT: process.env.FIRECRAWL_MCP_ENDPOINT || 'http://localhost:3333/api',
        BEDROCK_REGION: 'us-west-2', // Bedrockのリージョン
        LANGFUSE_API_KEY: process.env.LANGFUSE_API_KEY || '',
      },
    });

    // Bedrockへのアクセス許可を付与
    const bedrockPolicy = new iam.PolicyStatement({
      actions: [
        'bedrock:InvokeModel',
      ],
      resources: [
        `arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-7-sonnet-20240620-v1:0`,
      ],
    });
    apiHandler.addToRolePolicy(bedrockPolicy);

    // API Gateway - REST API
    const api = new apigateway.RestApi(this, 'UsmApi', {
      restApiName: `usm-api-${envName}`,
      description: 'URL SummerizerアプリケーションのバックエンドAPI',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // 開発用 (本番では特定のオリジンを指定)
        allowMethods: apigateway.Cors.ALL_METHODS, // 開発用 (本番では必要なメソッドのみ指定)
        allowHeaders: [
          'Content-Type',
          'Authorization',
        ],
        allowCredentials: true,
      },
    });

    // APIリソースとメソッド
    const summarize = api.root.addResource('summarize');
    summarize.addMethod('POST', new apigateway.LambdaIntegration(apiHandler));

    // ------------------------------------
    // 出力
    // ------------------------------------
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Domain Name',
    });
  }
}
