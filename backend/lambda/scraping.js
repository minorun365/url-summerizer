// Firecrawlを使用してWebページの内容をスクレイピングするモジュール

const axios = require('axios');

/**
 * Firecrawl APIを使用してURLの内容をスクレイピングする関数
 * @param {string} url - スクレイピング対象のURL
 * @returns {Promise<string>} - スクレイピングしたコンテンツ
 */
async function scrapePage(url) {
  try {
    console.log(`Firecrawlでスクレイピング開始: ${url}`);

    // APIキーを環境変数から取得
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      console.warn('FIRECRAWL_API_KEY環境変数が設定されていません');
    }

    // Firecrawlのスクレイピングオプション
    const scrapeOptions = {
      url: url,
      formats: ["markdown"],      // マークダウン形式で取得
      onlyMainContent: true,      // メインコンテンツのみを抽出
      waitFor: 3000,              // 動的コンテンツのロード待機時間
      removeBase64Images: true,   // Base64画像を削除
      blockAds: true              // 広告をブロック
    };

    // Firecrawl APIを直接呼び出し
    const response = await axios.post(
      process.env.FIRECRAWL_API_ENDPOINT || 'https://api.firecrawl.dev/v1/scrape', 
      scrapeOptions,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey ? `Bearer ${apiKey}` : undefined
        }
      }
    );

    // 公式APIのレスポンス形式に合わせて処理
    if (!response.data || !response.data.success || !response.data.data || !response.data.data.markdown) {
      console.error('API応答:', JSON.stringify(response.data));
      throw new Error('スクレイピング結果が取得できませんでした');
    }

    // マークダウン形式のコンテンツを取得
    const content = response.data.data.markdown || '';
    
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
