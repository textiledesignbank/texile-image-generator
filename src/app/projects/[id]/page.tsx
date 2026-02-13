"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Settings } from "lucide-react";
import { useProject, useHistories, useHistoryPolling } from "@/hooks/queries";
import { useGenerate } from "@/hooks/mutations";
import { useProjectPageStore } from "@/stores/useProjectPageStore";
import { ModelSelector } from "@/components/generation/ModelSelector";
import { TemplateSelector } from "@/components/generation/TemplateSelector";
import { ImageUploader } from "@/components/generation/ImageUploader";
import { ParamSettingsPanel } from "@/components/generation/ParamSettingsPanel";
import { GenerateActions } from "@/components/generation/GenerateActions";
import { ResultViewer } from "@/components/generation/ResultViewer";
import { HistoryList } from "@/components/generation/HistoryList";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const store = useProjectPageStore();
  const prevHistoriesLenRef = useRef<number | null>(null);

  // --- Data fetching ---
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: historiesData, isLoading: historiesLoading } = useHistories({
    projectId,
    pageSize: 20,
  });
  const histories = historiesData?.data ?? [];

  // Polling for active generation
  const { data: polledHistory } = useHistoryPolling(store.currentHistoryId);

  const generateMutation = useGenerate();

  // --- Side effects ---

  // 1. Init params when project loads
  useEffect(() => {
    if (!project) return;
    if (project.sdxlWorkflow) {
      store.setModelType("sdxl");
      store.initParamsFromConfig(project.sdxlParams);
    } else if (project.sd15Workflow) {
      store.setModelType("sd15");
      store.initParamsFromConfig(project.sd15Params);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  // 2. Re-init params when modelType changes (user-driven)
  useEffect(() => {
    if (!project) return;
    const paramConfigs = store.modelType === "sdxl" ? project.sdxlParams : project.sd15Params;
    store.initParamsFromConfig(paramConfigs);
    store.setSelectedTemplate("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.modelType]);

  // 3. Apply latest completed history params on first load
  useEffect(() => {
    if (prevHistoriesLenRef.current !== null) return; // Only on first load
    if (histories.length > 0) {
      prevHistoriesLenRef.current = histories.length;
      const latest = histories.find((h) => h.status === "completed");
      if (latest?.params) {
        store.setParamValues(latest.params as Record<string, unknown>);
        if (latest.modelType) store.setModelType(latest.modelType);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [histories.length]);

  // 4. Polling completion: stop generating, apply params
  useEffect(() => {
    if (!polledHistory) return;
    if (polledHistory.status === "completed" || polledHistory.status === "failed") {
      store.stopGenerating();
      if (polledHistory.status === "completed") {
        if (polledHistory.params) {
          store.setParamValues(polledHistory.params as Record<string, unknown>);
        }
        if (polledHistory.modelType) {
          store.setModelType(polledHistory.modelType);
        }
        store.setViewingHistoryId(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polledHistory?.status]);

  // 5. Cleanup on unmount
  useEffect(() => {
    return () => {
      store.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Handlers ---
  const handleGenerate = async () => {
    if (!project) return;
    const workflow = store.modelType === "sdxl" ? project.sdxlWorkflow : project.sd15Workflow;
    if (!workflow) {
      alert(`${store.modelType.toUpperCase()} 워크플로우가 설정되지 않았습니다.`);
      return;
    }
    try {
      const result = await generateMutation.mutateAsync({
        projectId,
        modelType: store.modelType,
        params: store.paramValues,
        inputImageBase64: store.inputImage || undefined,
      });
      store.startGenerating(result.historyId);
    } catch {
      alert("생성 요청 실패");
    }
  };

  // --- Render ---
  const currentParams =
    store.modelType === "sdxl" ? project?.sdxlParams : project?.sd15Params;

  if (projectLoading) {
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
            <ModelSelector
              sdxlAvailable={!!project.sdxlWorkflow}
              sd15Available={!!project.sd15Workflow}
            />
            <TemplateSelector projectId={projectId} />
            <ImageUploader />
            <ParamSettingsPanel params={currentParams ?? null} />
          </div>

          {/* 오른쪽: 결과 */}
          <div className="space-y-4">
            <GenerateActions onGenerate={handleGenerate} />
            <ResultViewer project={project} histories={histories} />
            <HistoryList
              project={project}
              histories={histories}
              isLoading={historiesLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
