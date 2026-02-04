"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ParamEditor } from "@/components/workflow/ParamEditor";
import { ImageUploader } from "@/components/workflow/ImageUploader";
import { HistoryCard } from "@/components/history/HistoryCard";
import {
  ArrowLeft,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ImageIcon,
  AlertCircle,
  History,
  Sparkles,
} from "lucide-react";
import type {
  WorkflowTemplate,
  ParamConfig,
  GenerateResponse,
  TestHistory,
  PaginatedResponse,
} from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

type GenerationState =
  | "idle"
  | "submitting"
  | "processing"
  | "completed"
  | "failed";

export default function GeneratePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [workflow, setWorkflow] = useState<WorkflowTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [paramValues, setParamValues] = useState<Record<string, unknown>>({});
  const [inputImage, setInputImage] = useState<string | undefined>();

  // 탭 상태
  const [activeTab, setActiveTab] = useState<string>("generate");

  // 히스토리 상태
  const [histories, setHistories] = useState<TestHistory[]>([]);
  const [historiesLoading, setHistoriesLoading] = useState(false);

  // 생성 상태 관리
  const [generationState, setGenerationState] =
    useState<GenerationState>("idle");
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [generatedHistory, setGeneratedHistory] = useState<TestHistory | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 히스토리 가져오기
  const fetchHistories = useCallback(async () => {
    setHistoriesLoading(true);
    try {
      const res = await fetch(`/api/history?workflowId=${id}`);
      if (res.ok) {
        const data: PaginatedResponse<TestHistory> = await res.json();
        setHistories(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch histories:", error);
    } finally {
      setHistoriesLoading(false);
    }
  }, [id]);

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
    fetchHistories();
  }, [id, fetchHistories]);

  // 상태 폴링
  const pollStatus = useCallback(async (historyId: string) => {
    try {
      const res = await fetch(`/api/history/${historyId}`);
      if (res.ok) {
        const history: TestHistory = await res.json();

        if (history.status === "completed") {
          setGenerationState("completed");
          setGeneratedHistory(history);
          fetchHistories(); // 히스토리 목록 갱신
          return true; // 폴링 중단
        } else if (history.status === "failed") {
          setGenerationState("failed");
          setErrorMessage(history.errorMessage || "이미지 생성에 실패했습니다");
          fetchHistories(); // 히스토리 목록 갱신
          return true; // 폴링 중단
        } else if (history.status === "cancelled") {
          setGenerationState("failed");
          setErrorMessage("작업이 취소되었습니다");
          fetchHistories(); // 히스토리 목록 갱신
          return true; // 폴링 중단
        }
      }
      return false; // 계속 폴링
    } catch (error) {
      console.error("Failed to poll status:", error);
      return false;
    }
  }, [fetchHistories]);

  useEffect(() => {
    if (generationState === "processing" && currentHistoryId) {
      const interval = setInterval(async () => {
        const shouldStop = await pollStatus(currentHistoryId);
        if (shouldStop) {
          clearInterval(interval);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [generationState, currentHistoryId, pollStatus]);

  const handleParamChange = (key: string, value: unknown) => {
    setParamValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!inputImage) return;

    setGenerationState("submitting");
    setGeneratedHistory(null);
    setErrorMessage(null);

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
        setCurrentHistoryId(data.historyId);
        setGenerationState("processing");
      } else {
        setGenerationState("failed");
        setErrorMessage("요청 전송에 실패했습니다");
      }
    } catch (error) {
      console.error("Failed to generate:", error);
      setGenerationState("failed");
      setErrorMessage("네트워크 오류가 발생했습니다");
    }
  };

  const handleReset = () => {
    setGenerationState("idle");
    setCurrentHistoryId(null);
    setGeneratedHistory(null);
    setErrorMessage(null);
  };

  // 파라미터를 읽기 쉽게 표시
  const getParamDisplayValue = (key: string, value: unknown): string => {
    if (typeof value === "number") {
      // seed는 그대로, 나머지는 소수점 2자리
      if (key.includes("seed")) return String(value);
      return Number.isInteger(value) ? String(value) : value.toFixed(2);
    }
    return String(value);
  };

  const getParamLabel = (key: string): string => {
    const param = (workflow?.editableParams as ParamConfig[])?.find(
      (p) => `${p.nodeId}.${p.paramPath}` === key,
    );
    return param?.displayNameKo || key.split(".").pop() || key;
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

  const canGenerate = !!inputImage && generationState === "idle";

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
        <Badge
          variant={workflow.modelType === "sdxl" ? "default" : "secondary"}
        >
          {workflow.modelType.toUpperCase()}
        </Badge>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="generate" className="gap-2">
            <Sparkles className="h-4 w-4" />
            생성
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            히스토리
            {histories.length > 0 && (
              <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {histories.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                입력 이미지
                {!inputImage && (
                  <span className="text-sm font-normal text-destructive">
                    (필수)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader value={inputImage} onChange={setInputImage} />
              {!inputImage && (
                <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  이미지를 업로드해야 생성할 수 있습니다
                </p>
              )}
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
          {/* 생성 버튼 및 상태 */}
          <Card>
            <CardHeader>
              <CardTitle>생성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {generationState === "idle" && (
                <>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    이미지 생성
                  </Button>
                  {!inputImage && (
                    <p className="text-sm text-center text-muted-foreground">
                      입력 이미지를 먼저 업로드해주세요
                    </p>
                  )}
                </>
              )}

              {generationState === "submitting" && (
                <div className="flex flex-col items-center py-6 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p className="text-sm">요청 전송 중...</p>
                </div>
              )}

              {generationState === "processing" && (
                <div className="flex flex-col items-center py-6">
                  <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <Clock className="h-5 w-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
                  </div>
                  <p className="mt-3 font-medium">이미지 생성 중...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    잠시만 기다려주세요
                  </p>
                </div>
              )}

              {generationState === "completed" && generatedHistory && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">생성 완료!</span>
                  </div>

                  {/* 결과 이미지 썸네일 */}
                  {generatedHistory.outputImageUrls &&
                    generatedHistory.outputImageUrls.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {generatedHistory.outputImageUrls.map((url, idx) => (
                          <div
                            key={idx}
                            className="aspect-square rounded-lg overflow-hidden border cursor-pointer hover:ring-2 ring-primary"
                            onClick={() =>
                              router.push(`/history/${generatedHistory.id}`)
                            }
                          >
                            <img
                              src={url}
                              alt={`결과 ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        router.push(`/history/${generatedHistory.id}`)
                      }
                    >
                      상세 보기
                    </Button>
                    <Button className="flex-1" onClick={handleReset}>
                      다시 생성
                    </Button>
                  </div>
                </div>
              )}

              {generationState === "failed" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">생성 실패</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {errorMessage}
                  </p>
                  <Button className="w-full" onClick={handleReset}>
                    다시 시도
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 파라미터 요약 (간결하게) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">현재 설정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(paramValues)
                  .filter(([key]) => !key.includes("seed")) // seed는 제외 (너무 김)
                  .slice(0, 8) // 최대 8개만 표시
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-muted-foreground truncate flex-1 mr-2">
                        {getParamLabel(key)}
                      </span>
                      <span className="font-mono font-medium">
                        {getParamDisplayValue(key, value)}
                      </span>
                    </div>
                  ))}
                {Object.keys(paramValues).length > 8 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{Object.keys(paramValues).length - 8}개 더
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {historiesLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              로딩 중...
            </div>
          ) : histories.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">
                아직 생성 히스토리가 없습니다
              </p>
              <Button onClick={() => setActiveTab("generate")}>
                <Sparkles className="h-4 w-4 mr-2" />
                첫 이미지 생성하기
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {histories.map((history) => (
                <HistoryCard
                  key={history.id}
                  history={history}
                  onClick={() => router.push(`/history/${history.id}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
