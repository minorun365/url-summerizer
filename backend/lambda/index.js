// URL-Summerizer Lambda関数のメインハンドラー
// Mastraフレームワークを使用して、URLスクレイピングと要約を行う

const { scrapePage } = require('./scraping');
const { summarizeContent } = require('./summarize');

// Lambda関数ハンドラー
exports.handler = async (event) => {
  console.log('リクエスト受信:', JSON.stringify(event));
  
  // CORSヘッダーを共通化（明示的にCloudFrontドメインを含む）
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };

  // OPTIONSリクエストの場合、即座にCORSヘッダーを返す
  if ((event.httpMethod && event.httpMethod === 'OPTIONS') || 
      (event.requestContext && event.requestContext.http && event.requestContext.http.method === 'OPTIONS')) {
    console.log('OPTIONSリクエスト受信: プリフライトレスポンスを返します');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  try {
    // Mastraモジュールを動的にインポート (ES Module対応)
    const { Agent, createTool } = await import('mastra');
    
    console.log('リクエストボディ:', event.body || 'なし');
    // API Gateway経由の場合
    const body = event.body ? JSON.parse(event.body) : event;
    const url = body.url;
    
    if (!url) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        body: JSON.stringify({ error: 'URLが指定されていません' })
      };
    }
    
    // URL検証
    try {
      new URL(url);
    } catch (e) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        body: JSON.stringify({ error: '有効なURLではありません' })
      };
    }
    
    // エージェント初期化
    const agent = new Agent({
      name: 'URL Summerizer',
      description: 'URLの内容をスクレイピングして日本語で要約するエージェント',
      tools: {
        scrape_url: createTool({
          id: 'scrape_url',
          description: 'Firecrawlを使用してWebページの内容をスクレイピングする',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'スクレイピングするURL'
              }
            },
            required: ['url']
          },
          execute: async ({ context: { url } }) => {
            console.log(`URLをスクレイピング中: ${url}`);
            return await scrapePage(url);
          }
        }),
        summarize_content: createTool({
          id: 'summarize_content',
          description: 'スクレイピングした内容をBedrockのClaude 3.7を使用して日本語で要約する',
          inputSchema: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: '要約する元のコンテンツ'
              },
              maxLength: {
                type: 'number',
                description: '要約の最大文字数（オプション）',
                default: 1000
              }
            },
            required: ['content']
          },
          execute: async ({ context: { content, maxLength } }) => {
            console.log('コンテンツを要約中...');
            return await summarizeContent(content, maxLength);
          }
        })
      }
    });
    
    // 実行プラン作成
    const executionPlan = `
      1. URLをスクレイピングして内容を取得する
      2. 取得した内容を日本語で簡潔に要約する
      3. 結果を返す
    `;
    
    // エージェントを実行
    const response = await agent.run({
      inputs: { url },
      instructions: `
        以下のURLの内容をスクレイピングし、日本語で簡潔に要約してください。
        ステップごとに処理を進めてください。
        
        入力URL: ${url}
      `,
      executionPlan
    });
    
    // 成功時のレスポンス
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      body: JSON.stringify({
        url: url,
        summary: response.output,
        createdAt: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    
    // エラー情報の詳細をログに出力
    console.error('詳細エラー情報:', error);
    console.error('スタックトレース:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      body: JSON.stringify({
        error: '処理中にエラーが発生しました',
        message: error.message,
        // 開発環境のみスタックトレースも返す
        ...(process.env.NODE_ENV !== 'prod' && { stack: error.stack })
      })
    };
  }
};
