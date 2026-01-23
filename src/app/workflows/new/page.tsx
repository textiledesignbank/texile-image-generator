"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus } from "lucide-react";
import type { WorkflowWithCount, PaginatedResponse } from "@/types";

export default function NewWorkflowPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<WorkflowWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowWithCount | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/workflows?pageSize=100");
        const data: PaginatedResponse<WorkflowWithCount> = await res.json();
        setTemplates(data.data);
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleSelectTemplate = (template: WorkflowWithCount) => {
    setSelectedTemplate(template);
    setNewName(`${template.name}_new`);
  };

  const handleCreate = async () => {
    if (!selectedTemplate) return;

    setCreating(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          sourceTemplateId: selectedTemplate.id,
        }),
      });

      if (res.ok) {
        const workflow = await res.json();
        router.push(`/workflows/${workflow.id}`);
      }
    } catch (error) {
      console.error("Failed to create workflow:", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">새 워크플로우 생성</h1>
          <p className="text-muted-foreground">템플릿을 선택하여 새 워크플로우를 생성하세요</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
      ) : (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">SDXL 템플릿</h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {templates
                .filter((t) => t.modelType === "sdxl")
                .map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        {template.name}
                        <Badge>SDXL</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        테스트 {template._count?.histories || 0}회
                      </p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">SD 1.5 템플릿</h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {templates
                .filter((t) => t.modelType === "sd15")
                .map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        {template.name}
                        <Badge variant="secondary">SD1.5</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        테스트 {template._count?.histories || 0}회
                      </p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </>
      )}

      <Dialog
        open={!!selectedTemplate}
        onOpenChange={() => setSelectedTemplate(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 워크플로우 생성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>원본 템플릿</Label>
              <p className="text-sm text-muted-foreground">
                {selectedTemplate?.name} ({selectedTemplate?.modelType.toUpperCase()})
              </p>
            </div>
            <div>
              <Label htmlFor="newName">새 워크플로우 이름</Label>
              <Input
                id="newName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="워크플로우 이름"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
              취소
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newName}>
              <Plus className="h-4 w-4 mr-2" />
              {creating ? "생성 중..." : "생성"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
