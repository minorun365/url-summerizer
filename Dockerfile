FROM public.ecr.aws/lambda/nodejs:20

# 作業ディレクトリを設定
WORKDIR ${LAMBDA_TASK_ROOT}

# package.jsonを直接作成
RUN echo '{ \
  "name": "url-summerizer-lambda", \
  "version": "1.0.0", \
  "description": "URL要約Lambda関数", \
  "main": "index.js", \
  "dependencies": { \
    "@aws-sdk/client-bedrock-runtime": "^3.515.0", \
    "axios": "^1.6.7", \
    "langfuse": "^2.0.0", \
    "mastra": "^0.5.0-alpha.8" \
  } \
}' > package.json

# 依存関係をインストール
RUN npm install --production

# Lambda関数コードをコピー
COPY backend/lambda/ ./

# ハンドラーを指定
CMD [ "index.handler" ]
