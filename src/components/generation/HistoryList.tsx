"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Loader2, X } from "lucide-react";
import { useProjectPageStore } from "@/stores/useProjectPageStore";
import type { Project, TestHistory } from "@/types";

interface HistoryListProps {
  project: Project;
  histories: TestHistory[];
  isLoading: boolean;
}

export function HistoryList({ project, histories, isLoading }: HistoryListProps) {
  const {
    compareMode,
    compareLeftId,
    compareRightId,
    viewingHistoryId,
    historyFilter,
    setHistoryFilter,
    setViewingHistoryId,
    handleCompareSelect,
  } = useProjectPageStore();

  const latestHistory = histories.find((h) => h.status === "completed") || null;

  return (
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
        {isLoading ? (
          <div className="text-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : histories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">기록이 없습니다</p>
        ) : (
          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            {histories
              .filter((h) => historyFilter === "all" || h.modelType === historyFilter)
              .sort((a, b) => {
                const aProcessing = a.status === "processing" || a.status === "pending";
                const bProcessing = b.status === "processing" || b.status === "pending";
                if (aProcessing && !bProcessing) return -1;
                if (!aProcessing && bProcessing) return 1;
                if (a.id === latestHistory?.id) return -1;
                if (b.id === latestHistory?.id) return 1;
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
                          isLatest ? null : isViewing ? null : history.id
                        );
                      }
                    }}
                  >
                    <div className="flex gap-2">
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
  );
}
