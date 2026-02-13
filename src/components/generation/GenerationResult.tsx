"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { ParamDisplay } from "@/components/workflow/ParamDisplay";
import { useProjectPageStore } from "@/stores/useProjectPageStore";
import type { Project, TestHistory } from "@/types";

interface GenerationResultProps {
  project: Project;
  histories: TestHistory[];
}

export function GenerationResult({ project, histories }: GenerationResultProps) {
  const { generating, compareMode, viewingHistoryId, setParamValues, setModelType } =
    useProjectPageStore();

  if (compareMode) return null;

  const latestHistory = histories.find((h) => h.status === "completed") || null;
  const viewingHistory = viewingHistoryId
    ? histories.find((h) => h.id === viewingHistoryId) || null
    : latestHistory;
  const isViewingLatest = !viewingHistoryId || viewingHistoryId === latestHistory?.id;

  const handleApplyParams = (history: TestHistory) => {
    if (history.params) {
      setParamValues(history.params as Record<string, unknown>);
    }
    if (history.modelType) {
      setModelType(history.modelType);
    }
  };

  return (
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
          {viewingHistory && viewingHistory.status === "completed" && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={() => handleApplyParams(viewingHistory)}
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
              const displayParams =
                viewingHistory.modelType === "sdxl" ? project.sdxlParams : project.sd15Params;
              return displayParams ? (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">사용된 파라미터</p>
                  <ParamDisplay
                    params={displayParams}
                    values={viewingHistory.params as Record<string, unknown>}
                  />
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
  );
}
