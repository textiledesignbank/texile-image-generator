import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Plus, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">TDB Image Generator</h1>
          <p className="text-lg text-muted-foreground">
            디자이너를 위한 이미지 생성 테스트 및 최적화 도구
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                프로젝트
              </CardTitle>
              <CardDescription>
                이미지 생성 테스트 프로젝트를 관리하고 최적의 파라미터를 찾으세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/projects">
                <Button className="w-full">프로젝트 목록 보기</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                빠른 시작
              </CardTitle>
              <CardDescription>
                새 프로젝트를 만들어 이미지 생성 테스트를 시작하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/projects/new">
                <Button variant="outline" className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  새 프로젝트 만들기
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
