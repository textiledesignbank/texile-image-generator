"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import type { TestHistory } from "@/types";

interface HistoryCardProps {
  history: TestHistory;
  onClick?: () => void;
  onDelete?: (id: string) => void;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
    className?: string;
  }
> = {
  pending: {
    label: "대기중",
    variant: "outline",
    icon: <Clock className="h-3 w-3" />,
  },
  processing: {
    label: "생성중",
    variant: "secondary",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  completed: {
    label: "완료",
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3" />,
    className: "bg-green-100 text-green-700 border-green-200",
  },
  failed: {
    label: "실패",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
  cancelled: {
    label: "취소됨",
    variant: "outline",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

export function HistoryCard({ history, onClick, onDelete }: HistoryCardProps) {
  const statusConfig = STATUS_CONFIG[history.status] || STATUS_CONFIG.pending;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(history.id);
  };

  return (
    <Card
      className={`hover:shadow-md transition-shadow cursor-pointer ${
        history.status === "processing" ? "ring-2 ring-blue-200" : ""
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate flex-1 mr-2">
            {history.workflow?.name || "삭제된 워크플로우"}
          </span>
          <div className="flex items-center gap-2">
            <Badge
              variant={statusConfig.variant}
              className={`flex items-center gap-1 ${statusConfig.className || ""}`}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 이미지 미리보기 - 입력/결과 구분 */}
        <div className="flex gap-3 items-start">
          {/* 입력 이미지 */}
          {history.inputImageUrl && (
            <div className="flex flex-col items-center gap-1">
              <div className="relative w-16 h-16 rounded-lg border-2 border-blue-200 overflow-hidden bg-blue-50">
                <img
                  src={history.inputImageUrl}
                  alt="Input"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] text-blue-600 font-medium">입력</span>
            </div>
          )}

          {/* 화살표 구분선 */}
          {history.inputImageUrl && (history.outputImageUrls?.length || history.status === "processing" || history.status === "failed") && (
            <div className="flex items-center h-16 text-muted-foreground">
              <span className="text-lg">→</span>
            </div>
          )}

          {/* 결과 이미지 영역 */}
          <div className="flex gap-2 flex-wrap">
            {history.status === "processing" && (
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
                <span className="text-[10px] text-blue-600 font-medium">생성중</span>
              </div>
            )}
            {history.status === "failed" && !history.outputImageUrls?.length && (
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 rounded-lg border-2 border-red-200 bg-red-50 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
                <span className="text-[10px] text-red-600 font-medium">실패</span>
              </div>
            )}
            {history.outputImageUrls &&
              history.outputImageUrls.slice(0, 2).map((url, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className="w-16 h-16 rounded-lg border-2 border-green-200 overflow-hidden bg-green-50">
                    <img
                      src={url}
                      alt={`Output ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {idx === 0 && <span className="text-[10px] text-green-600 font-medium">결과</span>}
                  {idx > 0 && <span className="text-[10px] text-transparent">.</span>}
                </div>
              ))}
            {history.outputImageUrls && history.outputImageUrls.length > 2 && (
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 rounded-lg border-2 border-green-200 bg-green-50 flex items-center justify-center text-sm text-green-600 font-medium">
                  +{history.outputImageUrls.length - 2}
                </div>
                <span className="text-[10px] text-transparent">.</span>
              </div>
            )}
          </div>
        </div>

        {/* 에러 메시지 */}
        {history.status === "failed" && history.errorMessage && (
          <p className="mt-2 text-xs text-destructive truncate">
            {history.errorMessage}
          </p>
        )}

        {/* 시간 정보 */}
        <p className="text-xs text-muted-foreground mt-2">
          {new Date(history.executedAt).toLocaleString("ko-KR")}
        </p>
      </CardContent>
    </Card>
  );
}
