"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FolderOpen, Image } from "lucide-react";
import type { Project, PaginatedResponse } from "@/types";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects");
        const data: PaginatedResponse<Project> = await res.json();
        setProjects(data.data);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">로딩 중...</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">프로젝트</h1>
          <p className="text-muted-foreground">
            이미지 생성 테스트 프로젝트를 관리합니다
          </p>
        </div>
        <Button onClick={() => router.push("/projects/new")}>
          <Plus className="h-4 w-4 mr-2" />
          새 프로젝트
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground mb-4">
            아직 프로젝트가 없습니다
          </p>
          <Button onClick={() => router.push("/projects/new")}>
            <Plus className="h-4 w-4 mr-2" />
            첫 프로젝트 만들기
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  {project.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Image className="h-4 w-4" />
                    {project._count?.histories || 0}개 테스트
                  </div>
                  <div className="flex gap-1">
                    {project.sdxlWorkflow && (
                      <span className="px-2 py-0.5 bg-primary/10 rounded text-xs">
                        SDXL
                      </span>
                    )}
                    {project.sd15Workflow && (
                      <span className="px-2 py-0.5 bg-secondary rounded text-xs">
                        SD1.5
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(project.updatedAt).toLocaleDateString("ko-KR")} 수정
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
