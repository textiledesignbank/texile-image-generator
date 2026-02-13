"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import { useCreateProject } from "@/hooks/mutations";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const createProject = useCreateProject();

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      const project = await createProject.mutateAsync({ name: name.trim() });
      router.push(`/projects/${project.id}`);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">새 프로젝트</h1>
          <p className="text-muted-foreground">
            이미지 생성 테스트를 위한 새 프로젝트를 만듭니다
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>프로젝트 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">프로젝트 이름</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 플로럴 패턴 테스트"
            />
          </div>

          <p className="text-sm text-muted-foreground">
            프로젝트 생성 후 설정에서 워크플로우를 추가할 수 있습니다.
          </p>

          <Button
            className="w-full"
            onClick={handleCreate}
            disabled={!name.trim() || createProject.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            {createProject.isPending ? "생성 중..." : "프로젝트 생성"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
