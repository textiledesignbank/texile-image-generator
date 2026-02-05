"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Trash2, AlertTriangle } from "lucide-react";
import type { Project } from "@/types";

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 수정 가능한 필드
  const [name, setName] = useState("");

  // 삭제 확인
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (res.ok) {
          const data: Project = await res.json();
          setProject(data);
          setName(data.name);
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        router.push(`/projects/${projectId}`);
      } else {
        alert("저장 실패");
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/projects");
      } else {
        alert("삭제 실패");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  if (loading) {
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
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "저장 중..." : "저장"}
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
                  <Button variant="destructive" onClick={handleDelete}>
                    삭제 확인
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
