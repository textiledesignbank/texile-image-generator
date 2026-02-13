"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitCompare, X, AlertTriangle } from "lucide-react";
import { ParamDisplay } from "@/components/workflow/ParamDisplay";
import { useProjectPageStore } from "@/stores/useProjectPageStore";
import type { Project, TestHistory } from "@/types";

interface ComparePanelProps {
  project: Project;
  histories: TestHistory[];
}

export function ComparePanel({ project, histories }: ComparePanelProps) {
  const { compareMode, compareLeftId, compareRightId, exitCompareMode } =
    useProjectPageStore();

  if (!compareMode) return null;

  const compareLeft = compareLeftId ? histories.find((h) => h.id === compareLeftId) || null : null;
  const compareRight = compareRightId ? histories.find((h) => h.id === compareRightId) || null : null;
  const compareModelMismatch =
    compareLeft && compareRight && compareLeft.modelType !== compareRight.modelType;

  return (
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
            {compareModelMismatch && (
              <div className="flex items-center gap-2 p-2 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                서로 다른 모델 타입의 결과를 비교하고 있습니다
              </div>
            )}
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
            {compareLeft.params && compareRight.params && (() => {
              const displayParams =
                compareLeft.modelType === "sdxl" ? project.sdxlParams : project.sd15Params;
              return displayParams ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    파라미터 차이 (노란색 = 다름)
                  </p>
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
  );
}
