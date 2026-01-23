"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ParamEditor } from "@/components/workflow/ParamEditor";
import { ArrowLeft, Save } from "lucide-react";
import type { WorkflowTemplate, ParamConfig } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WorkflowDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [workflow, setWorkflow] = useState<WorkflowTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [editableParams, setEditableParams] = useState<ParamConfig[]>([]);

  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        const res = await fetch(`/api/workflows/${id}`);
        if (res.ok) {
          const data = await res.json();
          setWorkflow(data);
          setName(data.name);
          setEditableParams(data.editableParams);
        }
      } catch (error) {
        console.error("Failed to fetch workflow:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkflow();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, editableParams }),
      });
      if (res.ok) {
        router.push("/workflows");
      }
    } catch (error) {
      console.error("Failed to save workflow:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleParamChange = (index: number, field: keyof ParamConfig, value: unknown) => {
    setEditableParams((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">로딩 중...</div>
    );
  }

  if (!workflow) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        워크플로우를 찾을 수 없습니다
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">워크플로우 편집</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">기본 정보</TabsTrigger>
              <TabsTrigger value="params">파라미터 설정</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>기본 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">이름</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>모델 타입</Label>
                    <div className="mt-1">
                      <Badge
                        variant={
                          workflow.modelType === "sdxl" ? "default" : "secondary"
                        }
                      >
                        {workflow.modelType.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>생성일</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(workflow.createdAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <div>
                    <Label>수정일</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(workflow.updatedAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="params" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>조절 가능한 파라미터</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {editableParams.map((param, index) => (
                      <div
                        key={`${param.nodeId}-${param.paramPath}`}
                        className="border rounded-lg p-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>표시 이름</Label>
                            <Input
                              value={param.displayNameKo}
                              onChange={(e) =>
                                handleParamChange(index, "displayNameKo", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label>영문 이름</Label>
                            <Input
                              value={param.displayName}
                              onChange={(e) =>
                                handleParamChange(index, "displayName", e.target.value)
                              }
                            />
                          </div>
                          {param.type === "number" && (
                            <>
                              <div>
                                <Label>최소값</Label>
                                <Input
                                  type="number"
                                  value={param.min || 0}
                                  onChange={(e) =>
                                    handleParamChange(index, "min", parseFloat(e.target.value))
                                  }
                                />
                              </div>
                              <div>
                                <Label>최대값</Label>
                                <Input
                                  type="number"
                                  value={param.max || 100}
                                  onChange={(e) =>
                                    handleParamChange(index, "max", parseFloat(e.target.value))
                                  }
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="json" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>워크플로우 JSON</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
                    {JSON.stringify(workflow.baseWorkflow, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>빠른 작업</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full"
                onClick={() => router.push(`/workflows/${id}/generate`)}
              >
                이미지 생성 테스트
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/workflows/${id}/history`)}
              >
                테스트 히스토리
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
