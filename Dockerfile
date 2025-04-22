FROM public.ecr.aws/lambda/nodejs:20

# 作業ディレクトリを設定
WORKDIR ${LAMBDA_TASK_ROOT}

# package.jsonをコピー
COPY backend/package.json ./

# 依存関係をインストール
RUN npm install --production

# Lambda関数コードをコピー
COPY backend/lambda/ ./

# ハンドラーを指定
CMD [ "index.handler" ]
