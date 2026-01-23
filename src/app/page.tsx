import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, History, Plus } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">ComfyUI Workflow Manager</h1>
          <p className="text-lg text-muted-foreground">
            디자이너를 위한 ComfyUI 워크플로우 관리 및 테스트 도구
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                워크플로우 관리
              </CardTitle>
              <CardDescription>
                패턴별 워크플로우 템플릿을 관리하고 파라미터를 조정하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/workflows">
                <Button className="w-full">워크플로우 목록 보기</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                테스트 히스토리
              </CardTitle>
              <CardDescription>
                이전 테스트 결과와 사용한 파라미터를 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/history">
                <Button variant="outline" className="w-full">
                  히스토리 보기
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Link href="/workflows/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              새 워크플로우 생성
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
