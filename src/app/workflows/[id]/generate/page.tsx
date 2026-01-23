"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParamEditor } from "@/components/workflow/ParamEditor";
import { ImageUploader } from "@/components/workflow/ImageUploader";
import { ArrowLeft, Play, Loader2 } from "lucide-react";
import type { WorkflowTemplate, ParamConfig, GenerateResponse } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GeneratePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [workflow, setWorkflow] = useState<WorkflowTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, unknown>>({});
  const [inputImage, setInputImage] = useState<string | undefined>();
  const [result, setResult] = useState<GenerateResponse | null>(null);

  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        const res = await fetch(`/api/workflows/${id}`);
        if (res.ok) {
          const data: WorkflowTemplate = await res.json();
          setWorkflow(data);

          // 기본값 설정
          const defaults: Record<string, unknown> = {};
          (data.editableParams as ParamConfig[]).forEach((param) => {
            defaults[`${param.nodeId}.${param.paramPath}`] = param.defaultValue;
          });
          setParamValues(defaults);
        }
      } catch (error) {
        console.error("Failed to fetch workflow:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkflow();
  }, [id]);

  const handleParamChange = (key: string, value: unknown) => {
    setParamValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: id,
          params: paramValues,
          inputImageBase64: inputImage,
        }),
      });

      if (res.ok) {
        const data: GenerateResponse = await res.json();
        setResult(data);
      }
    } catch (error) {
      console.error("Failed to generate:", error);
    } finally {
      setGenerating(false);
    }
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
          <h1 className="text-2xl font-bold">{workflow.name}</h1>
          <p className="text-muted-foreground">이미지 생성 테스트</p>
        </div>
        <Badge variant={workflow.modelType === "sdxl" ? "default" : "secondary"}>
          {workflow.modelType.toUpperCase()}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>입력 이미지</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader value={inputImage} onChange={setInputImage} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>파라미터</CardTitle>
            </CardHeader>
            <CardContent>
              <ParamEditor
                params={workflow.editableParams as ParamConfig[]}
                values={paramValues}
                onChange={handleParamChange}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>생성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    이미지 생성
                  </>
                )}
              </Button>

              {result && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">작업 제출 완료</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Job ID: {result.jobId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    상태: {result.status}
                  </p>
                  <Button
                    variant="link"
                    className="px-0 mt-2"
                    onClick={() => router.push(`/history`)}
                  >
                    히스토리에서 결과 확인
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>현재 파라미터 값</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify(paramValues, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
