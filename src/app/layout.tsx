import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ComfyUI Workflow Manager",
  description: "ComfyUI 워크플로우 관리 및 테스트 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <nav className="flex items-center justify-between">
                <a href="/" className="text-xl font-bold">
                  ComfyUI Workflow Manager
                </a>
                <div className="flex items-center gap-4">
                  <a
                    href="/workflows"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    워크플로우
                  </a>
                  <a
                    href="/history"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    히스토리
                  </a>
                </div>
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
