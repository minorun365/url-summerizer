#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { UsmStack } from '../lib/usm-stack';

const app = new cdk.App();

// 環境変数
const awsRegion = process.env.AWS_REGION || 'us-west-2'; // オレゴンリージョン
const envName = process.env.ENV_NAME || 'dev';
const awsAccountId = process.env.AWS_ACCOUNT_ID;

// タグ
const tags = {
  Project: 'url-summerizer',
  Environment: envName,
  Owner: 'personal',
};

// デプロイ環境
const env = {
  account: awsAccountId,
  region: awsRegion
};

// スタック作成
const stack = new UsmStack(app, `usm-stack-${envName}`, {
  env,
  stackName: `usm-stack-${envName}`,
  description: 'URL Summerizerアプリケーションのインフラリソース',
  crossRegionReferences: true, // クロスリージョン参照を有効化
  envName,
});

// タグを追加
Object.entries(tags).forEach(([key, value]) => {
  cdk.Tags.of(stack).add(key, value as string);
});
