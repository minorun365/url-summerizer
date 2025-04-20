// AWS BedrockのClaude 3.7を使用してコンテンツを要約するモジュール

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { Langfuse } = require('langfuse');

// Langfuse初期化 - 環境変数からキーを取得
const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com'
});

// Bedrock RuntimeクライアントをUS西部（オレゴン）リージョンで初期化
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION || 'us-west-2',
  credentials: {
    // AWS認証情報はLambdaの実行ロールから自動的に取得される
    // ローカル開発時は~/.aws/credentialsからsandboxプロファイルを使用
    profile: process.env.AWS_PROFILE || 'sandbox'
  }
});

/**
 * Claude 3.7を使用してコンテンツを要約する関数
 * @param {string} content - 要約する元コンテンツ
 * @param {number} maxLength - 要約の最大文字数 (デフォルト: 1000)
 * @returns {Promise<string>} - 日本語の要約テキスト
 */
async function summarizeContent(content, maxLength = 1000) {
  // Langfuseでトレースを作成
  const trace = langfuse.trace({
    name: "content_summary",
    metadata: {
      contentLength: content.length,
      maxLength: maxLength
    }
  });

  // 要約のスパンを開始
  const span = trace.span({
    name: "summarize_with_claude",
    input: { contentLength: content.length, maxLength }
  });
  try {
    console.log(`コンテンツの要約を開始 (${content.length}文字)`);

    // 長すぎるコンテンツはトランケート
    const maxInputLength = 100000; // Claude 3.7の入力制限に合わせて調整
    const truncatedContent = content.length > maxInputLength 
      ? content.substring(0, maxInputLength) + '\n...(内容が長いため省略されました)'
      : content;

    // Claude 3.7へのプロンプト
    const prompt = `
<input>
${truncatedContent}
</input>

上記のテキストを日本語で要約してください。以下の条件に従ってください：

1. 最大${maxLength}文字程度に収めてください
2. 原文の主要なポイントやトピックを網羅してください
3. 客観的かつ正確に要約してください
4. 読みやすく、簡潔な日本語で書いてください
5. 箇条書きではなく、通常の文章形式で要約してください
6. 原文に含まれる最も重要な情報を優先的に含めてください
7. 技術的な記事の場合は、専門用語を適切に保持してください

要約：
`;

    // Bedrock API リクエスト
    const modelId = 'anthropic.claude-3-7-sonnet-20240620-v1:0'; // Claude 3.7 Sonnet
    const startTime = Date.now();
    const params = {
      modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4096,
        temperature: 0.1, // 低温設定で一貫性の高い回答に
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    };

    console.log('Bedrock Claude 3.7による要約を開始');
    
    // LLM呼び出しをトラッキング
    const generation = await trace.generation({
      name: "claude_summarization",
      model: modelId,
      modelParameters: {
        temperature: 0.1,
        max_tokens: 4096
      },
      prompt: prompt,
      startTime: new Date(startTime)
    });
    
    const command = new InvokeModelCommand(params);
    const response = await bedrockClient.send(command);
    
    const endTime = Date.now();
    const latency = endTime - startTime;

    // レスポンスの解析
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const summary = responseBody.content[0].text;

    console.log(`要約が生成されました (${summary.length}文字)`);
    
    // LLM生成を完了し、結果を記録
    generation.end({
      completion: summary,
      endTime: new Date(endTime),
      usage: {
        promptTokens: content.length / 4, // おおよそのトークン数
        completionTokens: summary.length / 4, // おおよそのトークン数
      }
    });
    
    // スパンを完了
    span.end({
      output: { summaryLength: summary.length, latencyMs: latency }
    });
    
    // トレースを完了
    trace.update({
      output: { success: true, summaryLength: summary.length }
    });
    
    return summary.trim();

  } catch (error) {
    console.error('要約の生成中にエラーが発生しました:', error);
    
    // エラーを記録
    if (span) {
      span.end({
        level: "error",
        statusMessage: error.message
      });
    }
    
    if (trace) {
      trace.update({
        output: { success: false, error: error.message },
        level: "error"
      });
    }
    
    throw new Error(`テキスト要約に失敗しました: ${error.message}`);
  }
}

module.exports = {
  summarizeContent
};
