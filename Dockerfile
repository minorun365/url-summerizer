# AMD64に戻す（ARM64で互換性問題が発生している可能性）
FROM public.ecr.aws/lambda/nodejs:20

# 作業ディレクトリを固定
WORKDIR /var/task

# バックエンドpackage.jsonをコピー
COPY backend/lambda/package.json ./

# 依存関係を明示的にインストール（バージョン固定）
RUN npm install -g npm@latest && \
    npm install --legacy-peer-deps --production && \
    npm install @aws-sdk/client-bedrock-runtime@3.515.0 && \
    npm install axios@1.6.7 && \
    npm install langfuse@2.0.0 && \
    npm install mastra@0.5.0-alpha.8

# トラブルシューティング用のツールをインストール
RUN npm install --production aws-sdk

# Lambda関数コードをコピー
COPY backend/lambda/ ./

# ハンドラーを指定
CMD [ "index.handler" ]
