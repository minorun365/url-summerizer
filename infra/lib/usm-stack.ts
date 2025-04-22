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
    // スタック名に環境名を含める（リソース競合を避けるため）
    const stackName = `usm-stack-${envName}`;
    
    // ユーザープール
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `usm-users-${envName}`,
      removalPolicy: envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      selfSignUpEnabled: true,
      // ユーザー名（メールアドレスをユーザー名として使用）
      signInAliases: {
        email: true,
      },
      // サインイン時に必要な情報 (v2.131.0では異なる属性の指定方法を使用)
      standardAttributes: {
        email: {
          required: true,
          mutable: true
        },
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

    // ------------------------------------
    // S3 - フロントエンドデプロイ
    // ------------------------------------
    // フロントエンド用のS3バケット
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `usm-frontend-${envName}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY, 
      autoDeleteObjects: envName === 'prod' ? false : true, // 本番環境では無効化
    });

    // CloudFrontディストリビューション（CDN）
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: `URL Summerizer Frontend - ${envName}`,
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
    
    // コールバックURLリストを作成
    const callbackUrls = [];
    const logoutUrls = [];
    
    // CloudFrontのドメインを常に追加
    const cfDomain = `https://${distribution.distributionDomainName}`;
    callbackUrls.push(`${cfDomain}/auth/callback`);
    logoutUrls.push(cfDomain);
    
    // カスタムドメインが設定されている場合は追加
    const customDomain = process.env.CUSTOM_DOMAIN || '';
    if (customDomain) {
      callbackUrls.push(`https://${customDomain}/auth/callback`);
      logoutUrls.push(`https://${customDomain}`);
    }

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
      // 動的にコールバックURLを設定
      oAuth: {
        callbackUrls: callbackUrls,
        logoutUrls: logoutUrls,
      },
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
    
    // Lambda Layers
    
    // Mastraレイヤー - mastraフレームワークとその依存関係
    const mastraLayer = new lambda.LayerVersion(this, 'MastraLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-layers/mastra')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'Mastra framework and dependencies',
    });

    // ユーティリティレイヤー - その他の依存関係（Axios, AWS SDK等）
    const utilsLayer = new lambda.LayerVersion(this, 'UtilsLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-layers/utils')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'Axios, AWS SDK, and other utilities',
    });
    
    // APIハンドラーのLambda関数 - レイヤーを使用
    const apiHandler = new lambda.Function(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/lambda')),
      layers: [mastraLayer, utilsLayer], // レイヤーをアタッチ
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        // 環境変数
        NODE_ENV: envName,
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
        FIRECRAWL_API_ENDPOINT: process.env.FIRECRAWL_API_ENDPOINT || '',
        FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || '',
        BEDROCK_REGION: 'us-west-2', // Bedrockのリージョン
        LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY || '',
        LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY || '',
        LANGFUSE_HOST: process.env.LANGFUSE_HOST || '',
        // CORS設定用の環境変数
        ALLOWED_ORIGIN: '*',
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
      description: `URL SummerizerアプリケーションのバックエンドAPI (${envName})`,
      deployOptions: {
        stageName: envName,  // デプロイステージを環境名にする
        // ログ設定を完全に無効化（CloudWatchロールが未設定のため）
        loggingLevel: apigateway.MethodLoggingLevel.OFF,
        accessLogDestination: undefined,
        accessLogFormat: undefined,
        metricsEnabled: false,
      },
      defaultCorsPreflightOptions: {
        // すべてのオリジンを許可
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        // 必要なメソッドのみ許可
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With'
        ],
        allowCredentials: false,
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
