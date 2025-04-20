"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// SearchParamsを利用するコンポーネント
function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const url = searchParams.get("url");
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [createdAt] = useState(new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }));

  useEffect(() => {
    if (!url) {
      router.push("/");
      return;
    }

    const fetchResult = async () => {
      try {
        // 実際のAPIが実装されるまでモックデータを使用
        // 実装時はここを実際のAPI呼び出しに置き換え
        setTimeout(() => {
          setResult("これはURLから生成された要約のサンプルです。実際の結果は、FirecrawlでスクレイピングしたコンテンツをClaude 3.7が日本語で要約したものになります。この要約は、原文の主要なポイントを簡潔にまとめ、日本語で読みやすく表現します。");
          setLoading(false);
        }, 2000);
      } catch (err) {
        setError("エラーが発生しました。もう一度お試しください。");
        setLoading(false);
        console.error(err);
      }
    };

    fetchResult();
  }, [url, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-sm border p-8">
          <h1 className="text-2xl font-bold mb-6">処理中...</h1>
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
          <p className="text-center text-gray-600">
            URLの内容を解析して要約しています...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-sm border p-8">
          <h1 className="text-2xl font-bold text-red-500 mb-6">エラー</h1>
          <p className="text-center text-gray-600 mb-8">{error}</p>
          <div className="flex justify-center">
            <Link
              href="/"
              className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-sm border p-8">
        <h2 className="text-lg font-semibold mb-1">元URL:</h2>
        <h3 className="text-xl mb-4">
          <a
            href={url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-words"
          >
            {url}
          </a>
        </h3>
        <h2 className="text-lg font-semibold mb-2">要約結果</h2>
        
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <p className="text-gray-800 whitespace-pre-wrap">{result}</p>
        </div>
        
        <p className="text-sm text-gray-500 mb-8">
          作成日時: {createdAt}
        </p>

        <div className="flex justify-between">
          <Link
            href="/"
            className="text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            ホームに戻る
          </Link>
          
          <button
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
            onClick={() => window.open(url || "#", "_blank")}
          >
            元ページを開く
          </button>
        </div>
      </div>
    </div>
  );
}

// メインコンポーネント（Suspenseでラップ）
export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-sm border p-8">
          <h1 className="text-2xl font-bold mb-6">読み込み中...</h1>
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
          <p className="text-center text-gray-600">
            ページを読み込んでいます...
          </p>
        </div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
