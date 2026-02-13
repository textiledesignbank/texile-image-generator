"use client";

import { Button } from "@/components/ui/button";
import { Play, Loader2, GitCompare } from "lucide-react";
import { useProjectPageStore } from "@/stores/useProjectPageStore";

interface GenerateActionsProps {
  onGenerate: () => void;
}

export function GenerateActions({ onGenerate }: GenerateActionsProps) {
  const { generating, compareMode, inputImage, enterCompareMode, exitCompareMode } =
    useProjectPageStore();

  return (
    <div className="flex gap-2">
      <Button
        className="flex-1"
        size="lg"
        onClick={onGenerate}
        disabled={generating || compareMode || !inputImage}
      >
        {generating ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            생성 중...
          </>
        ) : (
          <>
            <Play className="h-5 w-5 mr-2" />
            이미지 생성
          </>
        )}
      </Button>
      <Button
        variant={compareMode ? "default" : "outline"}
        size="lg"
        onClick={() => (compareMode ? exitCompareMode() : enterCompareMode())}
        disabled={generating}
      >
        <GitCompare className="h-5 w-5 mr-2" />
        비교
      </Button>
    </div>
  );
}
