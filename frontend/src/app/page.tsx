"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    
    try {
      // 実際のAPI呼び出しは本番環境で実装
      // ここではクライアント側のみの処理でページ遷移
      router.push(`/result?url=${encodeURIComponent(url)}`);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-sm border p-8">
        <h1 className="text-3xl font-bold text-center mb-8">URLを要約</h1>
        <p className="text-center text-gray-600 mb-8">
          Webページの内容を日本語で簡潔に要約します
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="url"
              placeholder="https://example.com"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              disabled={loading}
            >
              {loading ? "処理中..." : "要約する"}
            </button>
          </div>
        </form>
        
        <p className="text-center text-gray-500 mt-6 text-sm">
          ログインすると履歴を保存できます
        </p>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
        <div className="text-center">
          <div className="bg-blue-50 p-4 rounded-full inline-block mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M9 9h6" />
              <path d="M9 13h6" />
              <path d="M9 17h6" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">ウェブページ分析</h3>
          <p className="text-sm text-gray-600">あらゆるURLのコンテンツを自動的にスクレイピング</p>
        </div>
        
        <div className="text-center">
          <div className="bg-blue-50 p-4 rounded-full inline-block mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">リアルタイム処理</h3>
          <p className="text-sm text-gray-600">処理状況をリアルタイムで表示し、進捗を確認</p>
        </div>
        
        <div className="text-center">
          <div className="bg-blue-50 p-4 rounded-full inline-block mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" x2="8" y1="13" y2="13" />
              <line x1="16" x2="8" y1="17" y2="17" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">日本語要約</h3>
          <p className="text-sm text-gray-600">Claude 3.7を使用した高品質な日本語要約</p>
        </div>
      </div>
    </div>
  );
}
