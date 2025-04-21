import type { NextConfig } from 'next';
import * as process from 'process';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 静的エクスポートの設定（S3にデプロイするため）
  output: 'export',
  // 画像最適化の設定
  images: {
    unoptimized: true, // S3にデプロイするため画像最適化を無効化
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_COGNITO_USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  },
  // 環境変数をビルド時に設定
  publicRuntimeConfig: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || '',
    cognitoUserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
    cognitoClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
  }
};

export default nextConfig;
