"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { TestHistory } from "@/types";

interface HistoryCardProps {
  history: TestHistory;
  onClick?: () => void;
  onDelete?: (id: string) => void;
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "대기중", variant: "outline" },
  processing: { label: "처리중", variant: "secondary" },
  completed: { label: "완료", variant: "default" },
  failed: { label: "실패", variant: "destructive" },
  cancelled: { label: "취소됨", variant: "outline" },
};

export function HistoryCard({ history, onClick, onDelete }: HistoryCardProps) {
  const statusInfo = STATUS_BADGE[history.status] || STATUS_BADGE.pending;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(history.id);
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate flex-1 mr-2">
            {history.workflow?.name || "삭제된 워크플로우"}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
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
        <div className="flex gap-2">
          {history.inputImageUrl && (
            <div className="w-16 h-16 rounded border overflow-hidden">
              <img
                src={history.inputImageUrl}
                alt="Input"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {history.outputImageUrls &&
            history.outputImageUrls.slice(0, 3).map((url, idx) => (
              <div key={idx} className="w-16 h-16 rounded border overflow-hidden">
                <img
                  src={url}
                  alt={`Output ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          {history.outputImageUrls && history.outputImageUrls.length > 3 && (
            <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center text-sm text-muted-foreground">
              +{history.outputImageUrls.length - 3}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {new Date(history.executedAt).toLocaleString("ko-KR")}
        </p>
      </CardContent>
    </Card>
  );
}
