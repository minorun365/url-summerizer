// URL-Summerizer Lambda関数のメインハンドラー
// Mastraフレームワークを使用して、URLスクレイピングと要約を行う

const { Agent, createTool } = require('mastra');
const { scrapePage } = require('./scraping');
const { summarizeContent } = require('./summarize');

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

// Lambda関数ハンドラー
exports.handler = async (event) => {
  console.log('リクエスト受信:', JSON.stringify(event));
  
  try {
    // API Gateway経由の場合
    const body = event.body ? JSON.parse(event.body) : event;
    const url = body.url;
    
    if (!url) {
      return {
        statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Credentials': 'true',
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
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
        body: JSON.stringify({ error: '有効なURLではありません' })
      };
    }
    
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
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: JSON.stringify({
        url: url,
        summary: response.output,
        createdAt: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: JSON.stringify({
        error: '処理中にエラーが発生しました',
        message: error.message
      })
    };
  }
};
