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

  X,
  Settings,
  History,
  Image as ImageIcon,
  GitCompare,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { ParamEditor } from "@/components/workflow/ParamEditor";
import { ParamDisplay } from "@/components/workflow/ParamDisplay";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  // Step 2: 생성 결과 보기 - viewingHistoryId (null이면 최신 결과)
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);

  // Step 5: 자유 비교 모드
  const [compareMode, setCompareMode] = useState(false);
  const [compareLeftId, setCompareLeftId] = useState<string | null>(null);
  const [compareRightId, setCompareRightId] = useState<string | null>(null);

  // 템플릿 파라미터
  const [templates, setTemplates] = useState<{ name: string; displayName: string; modelType: string }[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templateLoading, setTemplateLoading] = useState(false);

  // 히스토리 필터
  const [historyFilter, setHistoryFilter] = useState<"all" | "sdxl" | "sd15">("all");

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

  // 템플릿 목록 로드 (modelType 변경 시)
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch(`/api/templates?modelType=${modelType}`);
        if (res.ok) {
          const data = await res.json();
          setTemplates(data);
        }
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      }
      setSelectedTemplate("");
    };
    fetchTemplates();
  }, [modelType]);

  const handleTemplateSelect = async (name: string) => {
    setSelectedTemplate(name);
    setTemplateLoading(true);
    try {
      const res = await fetch(`/api/templates/${name}?projectId=${projectId}&modelType=${modelType}`);
      if (res.ok) {
        const data = await res.json();
        if (data.values && Object.keys(data.values).length > 0) {
          setParamValues((prev) => ({ ...prev, ...data.values }));
        }
      }
    } catch (error) {
      console.error("Failed to apply template:", error);
    } finally {
      setTemplateLoading(false);
    }
  };

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
  }, [histories.length]);

  // Step 4: 폴링 - 생성 완료 시 자동 파라미터 반영
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

            // Step 4: 생성 완료 시 자동으로 파라미터 반영
            if (history.status === "completed") {
              if (history.params) {
                setParamValues(history.params as Record<string, unknown>);
              }
              if (history.modelType) {
                setModelType(history.modelType);
              }
              setViewingHistoryId(null); // 최신 결과로 리셋
            }
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


  const handleApplyHistoryParams = (history: TestHistory) => {
    if (history.params) {
      setParamValues(history.params as Record<string, unknown>);
    }
    if (history.modelType) {
      setModelType(history.modelType);
    }
  };

  // Step 5: 비교 모드 선택 핸들러
  const handleCompareSelect = (historyId: string) => {
    if (!compareLeftId) {
      setCompareLeftId(historyId);
    } else if (!compareRightId) {
      if (historyId === compareLeftId) return; // 같은 항목 선택 방지
      setCompareRightId(historyId);
    } else {
      // 이미 둘 다 선택된 경우 리셋하고 새로 시작
      setCompareLeftId(historyId);
      setCompareRightId(null);
    }
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setCompareLeftId(null);
    setCompareRightId(null);
  };

  // 파생 값들
  const currentParams = modelType === "sdxl" ? project?.sdxlParams : project?.sd15Params;
  const latestHistory = histories.find(h => h.status === "completed") || null;
  const viewingHistory = viewingHistoryId
    ? histories.find(h => h.id === viewingHistoryId) || null
    : latestHistory;
  const isViewingLatest = !viewingHistoryId || viewingHistoryId === latestHistory?.id;

  // 비교 모드 히스토리
  const compareLeft = compareLeftId ? histories.find(h => h.id === compareLeftId) || null : null;
  const compareRight = compareRightId ? histories.find(h => h.id === compareRightId) || null : null;
  const compareModelMismatch = compareLeft && compareRight && compareLeft.modelType !== compareRight.modelType;

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

            {/* 템플릿 파라미터 */}
            {templates.length > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    템플릿 파라미터
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect} disabled={templateLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="템플릿을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.name} value={t.name}>{t.displayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

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
            {/* 생성 버튼 + 비교 모드 토글 */}
            <div className="flex gap-2">
              <Button className="flex-1" size="lg" onClick={handleGenerate} disabled={generating || compareMode || !inputImage}>
                {generating ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" />생성 중...</>
                ) : (
                  <><Play className="h-5 w-5 mr-2" />이미지 생성</>
                )}
              </Button>
              <Button
                variant={compareMode ? "default" : "outline"}
                size="lg"
                onClick={() => {
                  if (compareMode) {
                    exitCompareMode();
                  } else {
                    setCompareMode(true);
                  }
                }}
                disabled={generating}
              >
                <GitCompare className="h-5 w-5 mr-2" />
                비교
              </Button>
            </div>

            {/* Step 5: 비교 모드 */}
            {compareMode && (
              <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <GitCompare className="h-4 w-4" />
                      비교 모드
                    </span>
                    <Button variant="ghost" size="sm" onClick={exitCompareMode}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {!compareLeftId && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      아래 히스토리에서 첫 번째 항목을 선택하세요
                    </p>
                  )}
                  {compareLeftId && !compareRightId && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      두 번째 항목을 선택하세요
                    </p>
                  )}
                  {compareLeft && compareRight && (
                    <div className="space-y-3">
                      {/* 모델 불일치 경고 */}
                      {compareModelMismatch && (
                        <div className="flex items-center gap-2 p-2 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                          서로 다른 모델 타입의 결과를 비교하고 있습니다
                        </div>
                      )}
                      {/* 이미지 비교 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 text-center">
                            Left: {new Date(compareLeft.executedAt).toLocaleString("ko-KR")}
                          </p>
                          {compareLeft.outputImageUrls && (
                            <img
                              src={(compareLeft.outputImageUrls as string[])[0]}
                              alt="Left"
                              className="w-full rounded-md"
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 text-center">
                            Right: {new Date(compareRight.executedAt).toLocaleString("ko-KR")}
                          </p>
                          {compareRight.outputImageUrls && (
                            <img
                              src={(compareRight.outputImageUrls as string[])[0]}
                              alt="Right"
                              className="w-full rounded-md"
                            />
                          )}
                        </div>
                      </div>
                      {/* 파라미터 비교 */}
                      {compareLeft.params && compareRight.params && (() => {
                        const displayParams = compareLeft.modelType === "sdxl" ? project?.sdxlParams : project?.sd15Params;
                        return displayParams ? (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">파라미터 차이 (노란색 = 다름)</p>
                            <ParamDisplay
                              params={displayParams}
                              values={compareLeft.params as Record<string, unknown>}
                              compareValues={compareRight.params as Record<string, unknown>}
                            />
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: 생성 결과 - 비교 모드가 아닐 때만 */}
            {!compareMode && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      생성 결과
                      {!isViewingLatest && viewingHistory && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-normal">
                          {new Date(viewingHistory.executedAt).toLocaleString("ko-KR")} 기록
                        </span>
                      )}
                    </span>
                    {/* Step 3: 적용 버튼 - 최신이 아닐 때만 표시 */}
                    {viewingHistory && viewingHistory.status === "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handleApplyHistoryParams(viewingHistory)}
                      >
                        파라미터 적용
                      </Button>
                    )}
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
                  ) : viewingHistory?.outputImageUrls ? (
                    <div className="space-y-3">
                      {viewingHistory.inputImageUrl ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1 text-center">Input</p>
                            <img
                              src={viewingHistory.inputImageUrl}
                              alt="Input"
                              className="w-full rounded-md bg-muted"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1 text-center">Output</p>
                            <img
                              src={(viewingHistory.outputImageUrls as string[])[0]}
                              alt="Output"
                              className="w-full rounded-md"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {(viewingHistory.outputImageUrls as string[]).map((url, idx) => (
                            <img key={idx} src={url} alt={`Output ${idx + 1}`} className="w-full rounded-md" />
                          ))}
                        </div>
                      )}
                      {viewingHistory.params && (() => {
                        const displayParams = viewingHistory.modelType === "sdxl" ? project?.sdxlParams : project?.sd15Params;
                        return displayParams ? (
                          <div className="pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-2">사용된 파라미터</p>
                            <ParamDisplay params={displayParams} values={viewingHistory.params as Record<string, unknown>} />
                          </div>
                        ) : null;
                      })()}
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
                        // 생성중(processing/pending)이 최상단
                        const aProcessing = a.status === "processing" || a.status === "pending";
                        const bProcessing = b.status === "processing" || b.status === "pending";
                        if (aProcessing && !bProcessing) return -1;
                        if (!aProcessing && bProcessing) return 1;
                        // 최신 완료가 그 다음
                        if (a.id === latestHistory?.id) return -1;
                        if (b.id === latestHistory?.id) return 1;
                        // 나머지는 시간순
                        return new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime();
                      })
                      .map((history) => {
                      const isLatest = latestHistory?.id === history.id;
                      const isViewing = viewingHistoryId === history.id;
                      const isCompareLeft = compareLeftId === history.id;
                      const isCompareRight = compareRightId === history.id;

                      return (
                        <div
                          key={history.id}
                          className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                            compareMode && (isCompareLeft || isCompareRight)
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                              : isViewing && !compareMode
                                ? "border-muted-foreground bg-muted/50"
                                : isLatest && !compareMode
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:bg-muted/30"
                          }`}
                          onClick={() => {
                            if (history.status !== "completed") return;
                            if (compareMode) {
                              handleCompareSelect(history.id);
                            } else {
                              setViewingHistoryId(
                                isLatest ? null : (isViewing ? null : history.id)
                              );
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


                                {/* 비교 모드 라벨 */}
                                {compareMode && isCompareLeft && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white">
                                    Left
                                  </span>
                                )}
                                {compareMode && isCompareRight && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white">
                                    Right
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {new Date(history.executedAt).toLocaleString("ko-KR")}
                              </p>



                            </div>
                          </div>
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
