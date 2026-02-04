"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();

  // 로그인 페이지에서는 헤더 숨김
  if (pathname === "/login") {
    return null;
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <a href="/" className="text-xl font-bold">
            TDB Image Generator
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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-1" />
              로그아웃
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
