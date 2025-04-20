"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Consent() {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accepted) {
      return;
    }
    
    setLoading(true);
    
    try {
      // 実際の実装では、Cognitoのカスタム属性にユーザーの同意状況を保存する
      console.log("同意情報を保存中...");
      
      // 処理完了後ホームページへリダイレクト
      router.push("/");
    } catch (err) {
      console.error("同意保存エラー:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border p-8">
        <h1 className="text-2xl font-bold text-center mb-6">利用規約と個人情報の取り扱い</h1>
        
        <div className="overflow-y-auto h-64 border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
          <h2 className="text-lg font-semibold mb-3">利用規約</h2>
          <p className="mb-4 text-sm text-gray-700">
            本サービス「URL Summerizer」（以下「本サービス」）の利用にあたっては、以下の利用規約に同意いただく必要があります。
          </p>
          
          <h3 className="font-medium mb-2 text-sm">1. サービスの内容</h3>
          <p className="mb-3 text-sm text-gray-700">
            本サービスは、ユーザーが提供したURLの内容をスクレイピングし、AI技術を用いて要約を生成するサービスです。
          </p>
          
          <h3 className="font-medium mb-2 text-sm">2. 個人情報の取り扱い</h3>
          <p className="mb-3 text-sm text-gray-700">
            本サービスでは、ユーザー認証のために以下の個人情報を取得します：<br />
            - メールアドレス<br />
            - 要約履歴（リクエストしたURL、要約結果）
          </p>
          
          <h3 className="font-medium mb-2 text-sm">3. データの利用目的</h3>
          <p className="mb-3 text-sm text-gray-700">
            取得した個人情報は以下の目的のみに利用します：<br />
            - ユーザー認証<br />
            - 要約履歴の表示<br />
            - サービス品質の向上<br />
            - 統計情報の作成（個人を特定しない形で）
          </p>
          
          <h3 className="font-medium mb-2 text-sm">4. 第三者提供</h3>
          <p className="mb-3 text-sm text-gray-700">
            取得した個人情報は、法令に基づく場合を除き、ユーザーの同意なしに第三者に提供することはありません。
          </p>
          
          <h3 className="font-medium mb-2 text-sm">5. 免責事項</h3>
          <p className="mb-3 text-sm text-gray-700">
            本サービスは、要約結果の正確性や完全性を保証するものではありません。要約結果の利用はユーザーの責任において行ってください。
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center">
            <input
              id="consent"
              type="checkbox"
              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              required
            />
            <label htmlFor="consent" className="ml-2 block text-sm text-gray-700">
              上記の利用規約と個人情報の取り扱いに同意します
            </label>
          </div>
          
          <div className="flex justify-between">
            <Link
              href="/auth/signup"
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              戻る
            </Link>
            
            <button
              type="submit"
              disabled={!accepted || loading}
              className={`bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-6 rounded-lg transition-colors ${
                !accepted ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "処理中..." : "同意して登録"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
