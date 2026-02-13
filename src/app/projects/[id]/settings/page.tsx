"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Trash2, AlertTriangle } from "lucide-react";
import { useProject } from "@/hooks/queries";
import { useUpdateProject, useDeleteProject } from "@/hooks/mutations";

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading } = useProject(projectId);
  const updateProject = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  const [name, setName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
    }
  }, [project]);

  const handleSave = async () => {
    if (updateProject.isPending) return;
    try {
      await updateProject.mutateAsync({ id: projectId, data: { name } });
      router.push(`/projects/${projectId}`);
    } catch {
      alert("저장 실패");
    }
  };

  const handleDelete = async () => {
    if (deleteProjectMutation.isPending) return;
    try {
      await deleteProjectMutation.mutateAsync(projectId);
      router.push("/projects");
    } catch {
      alert("삭제 실패");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">로딩 중...</div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        프로젝트를 찾을 수 없습니다
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/projects/${projectId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">프로젝트 설정</h1>
          <p className="text-sm text-muted-foreground">{project.name}</p>
        </div>
        <Button onClick={handleSave} disabled={updateProject.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateProject.isPending ? "저장 중..." : "저장"}
        </Button>
      </div>

      <div className="space-y-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">프로젝트 이름</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="pt-4 border-t space-y-2">
              <p className="text-sm text-muted-foreground">
                워크플로우 설정:
              </p>
              <div className="flex gap-2">
                {project.sdxlWorkflow && (
                  <span className="px-2 py-1 bg-primary/10 rounded text-xs">
                    SDXL 설정됨
                  </span>
                )}
                {project.sd15Workflow && (
                  <span className="px-2 py-1 bg-secondary rounded text-xs">
                    SD1.5 설정됨
                  </span>
                )}
                {!project.sdxlWorkflow && !project.sd15Workflow && (
                  <span className="text-xs text-muted-foreground">
                    설정된 워크플로우 없음
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 삭제 */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-lg text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              위험 영역
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showDeleteConfirm ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  정말로 이 프로젝트를 삭제하시겠습니까? 모든 테스트 기록도 함께
                  삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                </p>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={handleDelete} disabled={deleteProjectMutation.isPending}>
                    {deleteProjectMutation.isPending ? "삭제 중..." : "삭제 확인"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                프로젝트 삭제
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
