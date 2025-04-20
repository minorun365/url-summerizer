import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "URL Summerizer",
  description: "URLを入力すると内容を要約するWebアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="border-b">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <Link href="/" className="text-primary text-xl font-bold">
                URL Summerizer
              </Link>
              <Link href="/auth/signin" className="text-gray-600 hover:text-primary">
                ログイン
              </Link>
            </div>
          </header>
          <main className="flex-1 container mx-auto px-4 py-6">
            {children}
          </main>
          <footer className="bg-gray-50 border-t">
            <div className="container mx-auto px-4 py-3 text-center text-gray-500 text-sm">
              © 2025 URL Summerizer - 個人開発プロジェクト
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
