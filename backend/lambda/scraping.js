// Firecrawlを使用してWebページの内容をスクレイピングするモジュール

const axios = require('axios');

/**
 * Firecrawl MCPを使用してURLの内容をスクレイピングする関数
 * @param {string} url - スクレイピング対象のURL
 * @returns {Promise<string>} - スクレイピングしたコンテンツ
 */
async function scrapePage(url) {
  try {
    console.log(`Firecrawlでスクレイピング開始: ${url}`);

    // Firecrawlのスクレイピングオプション
    const scrapeOptions = {
      url: url,
      formats: ["markdown"],      // マークダウン形式で取得
      onlyMainContent: true,      // メインコンテンツのみを抽出
      waitFor: 3000,              // 動的コンテンツのロード待機時間
      removeBase64Images: true    // Base64画像を削除
    };

    // Firecrawl MCPサーバーにリクエスト
    const response = await axios.post(process.env.FIRECRAWL_MCP_ENDPOINT || 'http://localhost:3333/api', {
      server_name: 'firecrawl-mcp',
      tool_name: 'firecrawl_scrape',
      arguments: scrapeOptions
    });

    if (!response.data || !response.data.result) {
      throw new Error('スクレイピング結果が取得できませんでした');
    }

    // マークダウン形式のコンテンツを取得
    const content = response.data.result.markdown || '';
    
    if (!content) {
      console.warn('スクレイピングされたコンテンツが空です');
      return '(コンテンツが取得できませんでした)';
    }

    console.log(`スクレイピング完了: ${url} (${content.length}文字)`);
    return content;
  } catch (error) {
    console.error('スクレイピング中にエラーが発生しました:', error);
    throw new Error(`スクレイピングに失敗しました: ${error.message}`);
  }
}

module.exports = {
  scrapePage
};
