"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Upload,
  Play,
  Loader2,
  Check,
  X,
  Settings,
  History,
  Image as ImageIcon,
  GitCompare,
} from "lucide-react";
import { ParamEditor } from "@/components/workflow/ParamEditor";
import { ParamDisplay } from "@/components/workflow/ParamDisplay";
import type {
  Project,
  TestHistory,
  ParamConfig,
  ModelType,
  PaginatedResponse,
} from "@/types";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [modelType, setModelType] = useState<ModelType>("sdxl");
  const [paramValues, setParamValues] = useState<Record<string, unknown>>({});
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [inputImagePreview, setInputImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generating, setGenerating] = useState(false);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [histories, setHistories] = useState<TestHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 비교 모드
  const [compareHistory, setCompareHistory] = useState<TestHistory | null>(null);

  // 히스토리 필터
  const [historyFilter, setHistoryFilter] = useState<"all" | "sdxl" | "sd15">("all");

  // 선택된 히스토리 (파라미터 보기용)
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (res.ok) {
          const data: Project = await res.json();
          setProject(data);
          if (data.sdxlWorkflow) {
            setModelType("sdxl");
            initParams(data.sdxlParams);
          } else if (data.sd15Workflow) {
            setModelType("sd15");
            initParams(data.sd15Params);
          }
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const initParams = (paramConfigs: ParamConfig[] | null) => {
    if (!paramConfigs) return;
    const values: Record<string, unknown> = {};
    paramConfigs.forEach((p) => {
      const key = `${p.nodeId}.${p.paramPath}`;
      values[key] = p.defaultValue;
    });
    setParamValues(values);
  };

  useEffect(() => {
    if (!project) return;
    const paramConfigs = modelType === "sdxl" ? project.sdxlParams : project.sd15Params;
    initParams(paramConfigs);
  }, [modelType, project]);

  const fetchHistories = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/history?projectId=${projectId}&pageSize=20`);
      if (res.ok) {
        const data: PaginatedResponse<TestHistory> = await res.json();
        setHistories(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch histories:", error);
    } finally {
      setHistoryLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchHistories();
  }, [fetchHistories]);

  // 히스토리가 로드되면 최신 히스토리의 파라미터 적용
  useEffect(() => {
    if (histories.length > 0) {
      const latest = histories.find(h => h.status === "completed");
      if (latest && latest.params) {
        setParamValues(latest.params as Record<string, unknown>);
        if (latest.modelType) {
          setModelType(latest.modelType);
        }
      }
    }
  }, [histories.length]); // histories.length가 변경될 때만 실행 (최초 로드 시)

  useEffect(() => {
    if (!currentHistoryId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/history/${currentHistoryId}`);
        if (res.ok) {
          const history: TestHistory = await res.json();
          if (history.status === "completed" || history.status === "failed") {
            setGenerating(false);
            setCurrentHistoryId(null);
            fetchHistories();
          }
        }
      } catch (error) {
        console.error("Failed to poll history:", error);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [currentHistoryId, fetchHistories]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setInputImage(base64);
      setInputImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!project) return;
    const workflow = modelType === "sdxl" ? project.sdxlWorkflow : project.sd15Workflow;
    if (!workflow) {
      alert(`${modelType.toUpperCase()} 워크플로우가 설정되지 않았습니다.`);
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          modelType,
          params: paramValues,
          inputImageBase64: inputImage || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentHistoryId(data.historyId);
        fetchHistories();
      } else {
        setGenerating(false);
        alert("생성 요청 실패");
      }
    } catch (error) {
      console.error("Failed to generate:", error);
      setGenerating(false);
    }
  };

  const handleSelectHistory = async (historyId: string) => {
    try {
      await fetch(`/api/history/${historyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSelected: true }),
      });
      fetchHistories();
    } catch (error) {
      console.error("Failed to select history:", error);
    }
  };

  const handleApplyHistoryParams = (history: TestHistory) => {
    if (history.params) {
      setParamValues(history.params as Record<string, unknown>);
    }
    if (history.modelType) {
      setModelType(history.modelType);
    }
  };

  const currentParams = modelType === "sdxl" ? project?.sdxlParams : project?.sd15Params;
  const latestHistory = histories.length > 0 && histories[0].status === "completed" ? histories[0] : null;

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">로딩 중...</div>;
  }

  if (!project) {
    return <div className="container mx-auto px-4 py-8 text-center">프로젝트를 찾을 수 없습니다</div>;
  }

  const hasWorkflow = project.sdxlWorkflow || project.sd15Workflow;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">이미지 생성 테스트 및 최적 파라미터 탐색</p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/projects/${projectId}/settings`)}>
          <Settings className="h-4 w-4 mr-2" />
          설정
        </Button>
      </div>

      {!hasWorkflow ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">워크플로우가 설정되지 않았습니다</p>
            <Button onClick={() => router.push(`/projects/${projectId}/settings`)}>
              워크플로우 설정하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* 왼쪽: 입력 및 설정 */}
          <div className="space-y-4">
            {/* 모델 선택 */}
            <Card>
              <CardContent className="pt-4">
                <Tabs value={modelType} onValueChange={(v) => setModelType(v as ModelType)}>
                  <TabsList className="w-full">
                    <TabsTrigger value="sdxl" className="flex-1" disabled={!project.sdxlWorkflow}>
                      SDXL
                    </TabsTrigger>
                    <TabsTrigger value="sd15" className="flex-1" disabled={!project.sd15Workflow}>
                      SD1.5
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {/* 입력 이미지 */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  입력 이미지
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {inputImagePreview ? (
                  <div className="relative">
                    <img src={inputImagePreview} alt="Input" className="w-full max-h-48 object-contain rounded-md bg-muted" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => { setInputImage(null); setInputImagePreview(null); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full h-32" onClick={() => fileInputRef.current?.click()}>
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">클릭하여 업로드</span>
                    </div>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* 파라미터 설정 */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  파라미터 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {currentParams && currentParams.length > 0 ? (
                  <ParamEditor
                    params={currentParams}
                    values={paramValues}
                    onChange={(key, value) => setParamValues((prev) => ({ ...prev, [key]: value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">파라미터가 없습니다</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 결과 */}
          <div className="space-y-4">
            {/* 생성 버튼 */}
            <Button className="w-full" size="lg" onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" />생성 중...</>
              ) : (
                <><Play className="h-5 w-5 mr-2" />이미지 생성</>
              )}
            </Button>

            {/* 비교 모드 활성화 시 */}
            {compareHistory && (
              <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <GitCompare className="h-4 w-4" />
                      비교 모드
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setCompareHistory(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* 이미지 비교 */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 text-center">최신 결과</p>
                      {latestHistory?.outputImageUrls && (
                        <img
                          src={(latestHistory.outputImageUrls as string[])[0]}
                          alt="Latest"
                          className="w-full rounded-md"
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 text-center">비교 대상</p>
                      {compareHistory.outputImageUrls && (
                        <img
                          src={(compareHistory.outputImageUrls as string[])[0]}
                          alt="Compare"
                          className="w-full rounded-md"
                        />
                      )}
                    </div>
                  </div>
                  {/* 파라미터 비교 */}
                  {currentParams && latestHistory?.params && compareHistory.params && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">파라미터 차이 (노란색 = 다름)</p>
                      <ParamDisplay
                        params={currentParams}
                        values={latestHistory.params as Record<string, unknown>}
                        compareValues={compareHistory.params as Record<string, unknown>}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 생성 결과 */}
            {!compareHistory && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    생성 결과
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {generating ? (
                    <div className="flex items-center justify-center h-48 bg-muted rounded-md">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">생성 중...</p>
                      </div>
                    </div>
                  ) : latestHistory?.outputImageUrls ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {(latestHistory.outputImageUrls as string[]).map((url, idx) => (
                          <img key={idx} src={url} alt={`Output ${idx + 1}`} className="w-full rounded-md" />
                        ))}
                      </div>
                      {currentParams && latestHistory.params && (
                        <div className="pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-2">사용된 파라미터</p>
                          <ParamDisplay params={currentParams} values={latestHistory.params as Record<string, unknown>} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">생성된 이미지가 없습니다</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 히스토리 */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    테스트 히스토리
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant={historyFilter === "all" ? "default" : "ghost"}
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setHistoryFilter("all")}
                    >
                      전체
                    </Button>
                    <Button
                      variant={historyFilter === "sdxl" ? "default" : "ghost"}
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setHistoryFilter("sdxl")}
                      disabled={!project.sdxlWorkflow}
                    >
                      SDXL
                    </Button>
                    <Button
                      variant={historyFilter === "sd15" ? "default" : "ghost"}
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setHistoryFilter("sd15")}
                      disabled={!project.sd15Workflow}
                    >
                      SD1.5
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {historyLoading ? (
                  <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                ) : histories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">기록이 없습니다</p>
                ) : (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto">
                    {histories
                      .filter((h) => historyFilter === "all" || h.modelType === historyFilter)
                      .sort((a, b) => {
                        // 현재(최신)가 첫번째
                        if (a.id === latestHistory?.id) return -1;
                        if (b.id === latestHistory?.id) return 1;
                        // 최종선택이 두번째
                        if (a.isSelected && !b.isSelected) return -1;
                        if (!a.isSelected && b.isSelected) return 1;
                        // 나머지는 시간순
                        return new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime();
                      })
                      .map((history) => {
                      const historyParams = history.modelType === "sdxl" ? project?.sdxlParams : project?.sd15Params;
                      const isComparing = compareHistory?.id === history.id;
                      const isLatest = latestHistory?.id === history.id;
                      const isSelected = selectedHistoryId === history.id;

                      return (
                        <div
                          key={history.id}
                          className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                            isLatest
                              ? "border-primary bg-primary/10"
                              : isComparing
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                                : isSelected
                                  ? "border-muted-foreground bg-muted/50"
                                  : "border-border hover:bg-muted/30"
                          }`}
                          onClick={() => {
                            if (!isLatest && history.status === "completed") {
                              setSelectedHistoryId(isSelected ? null : history.id);
                            }
                          }}
                        >
                          <div className="flex gap-2">
                            {/* 썸네일 */}
                            <div className="w-14 h-14 flex-shrink-0 bg-muted rounded overflow-hidden">
                              {history.status === "completed" && history.outputImageUrls ? (
                                <img
                                  src={(history.outputImageUrls as string[])[0]}
                                  alt="Result"
                                  className="w-full h-full object-cover"
                                />
                              ) : history.status === "processing" || history.status === "pending" ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <X className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            {/* 정보 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">
                                  {history.modelType?.toUpperCase()}
                                </span>
                                {isLatest && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                                    현재
                                  </span>
                                )}
                                {history.isSelected && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-600 text-white">
                                    최종선택
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {new Date(history.executedAt).toLocaleString("ko-KR")}
                              </p>

                              {/* 버튼들 - 현재가 아닌 완료된 히스토리만 */}
                              {!isLatest && history.status === "completed" && (
                                <div className="flex gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-[10px] px-2"
                                    onClick={() => handleApplyHistoryParams(history)}
                                  >
                                    적용
                                  </Button>
                                  {latestHistory && latestHistory.modelType === history.modelType && (
                                    <Button
                                      variant={isComparing ? "default" : "outline"}
                                      size="sm"
                                      className="h-6 text-[10px] px-2"
                                      onClick={() => setCompareHistory(isComparing ? null : history)}
                                    >
                                      <GitCompare className="h-3 w-3 mr-1" />
                                      비교
                                    </Button>
                                  )}
                                  {!history.isSelected && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 text-[10px] px-2 text-green-600 border-green-600 hover:bg-green-50"
                                      onClick={() => handleSelectHistory(history.id)}
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      최종선택
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 파라미터 상세 - 선택된 히스토리만 표시 */}
                          {!isLatest && isSelected && history.status === "completed" && historyParams && history.params && (
                            <div className="mt-2 pt-2 border-t">
                              <ParamDisplay
                                params={historyParams}
                                values={history.params as Record<string, unknown>}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
