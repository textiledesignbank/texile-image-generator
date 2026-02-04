"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { TestHistory, ParamConfig } from "@/types";
import { CATEGORY_DISPLAY_NAMES } from "@/lib/workflow-parser";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "대기중", variant: "outline" },
  processing: { label: "처리중", variant: "secondary" },
  completed: { label: "완료", variant: "default" },
  failed: { label: "실패", variant: "destructive" },
};

export default function HistoryDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [history, setHistory] = useState<TestHistory | null>(null);
  const [editableParams, setEditableParams] = useState<ParamConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/history/${id}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);

        // 워크플로우의 editableParams 가져오기
        if (data.workflow?.editableParams) {
          setEditableParams(data.workflow.editableParams as ParamConfig[]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  // 파라미터 키에서 표시 이름 가져오기
  const getParamLabel = (key: string): string => {
    const param = editableParams.find(
      (p) => `${p.nodeId}.${p.paramPath}` === key
    );
    return param?.displayNameKo || key.split(".").pop() || key;
  };

  // 파라미터 값 포맷팅
  const getParamDisplayValue = (key: string, value: unknown): string => {
    if (typeof value === "number") {
      if (key.includes("seed")) return String(value);
      return Number.isInteger(value) ? String(value) : value.toFixed(2);
    }
    return String(value);
  };

  // 카테고리별로 파라미터 그룹화
  const getGroupedParams = () => {
    const params = history?.params as Record<string, unknown> | null;
    if (!params) return {};

    const grouped: Record<string, { key: string; value: unknown; label: string }[]> = {};

    Object.entries(params).forEach(([key, value]) => {
      const paramConfig = editableParams.find(
        (p) => `${p.nodeId}.${p.paramPath}` === key
      );
      const category = paramConfig?.category || "other";

      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push({
        key,
        value,
        label: getParamLabel(key),
      });
    });

    return grouped;
  };

  useEffect(() => {
    fetchHistory();
  }, [id]);

  // 자동 새로고침 (처리중일 때)
  useEffect(() => {
    if (history?.status === "pending" || history?.status === "processing") {
      const interval = setInterval(fetchHistory, 3000);
      return () => clearInterval(interval);
    }
  }, [history?.status]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">로딩 중...</div>
    );
  }

  if (!history) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        히스토리를 찾을 수 없습니다
      </div>
    );
  }

  const statusInfo = STATUS_BADGE[history.status] || STATUS_BADGE.pending;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">테스트 상세</h1>
          <p className="text-muted-foreground">
            {history.workflow?.name || "삭제된 워크플로우"}
          </p>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        <Button variant="outline" onClick={fetchHistory}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              입력 이미지
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.inputImageUrl ? (
              <div className="aspect-square w-full max-w-md mx-auto overflow-hidden rounded-lg border border-blue-200">
                <img
                  src={history.inputImageUrl}
                  alt="Input"
                  className="w-full h-full object-contain bg-muted/30"
                />
              </div>
            ) : (
              <div className="aspect-square w-full max-w-md mx-auto bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                입력 이미지 없음
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              출력 이미지
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.status === "processing" || history.status === "pending" ? (
              <div className="aspect-square w-full max-w-md mx-auto bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span>처리 중...</span>
                </div>
              </div>
            ) : history.outputImageUrls && history.outputImageUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {history.outputImageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="aspect-square overflow-hidden rounded-lg border border-green-200 cursor-pointer hover:ring-2 ring-green-500"
                    onClick={() => window.open(url, '_blank')}
                  >
                    <img
                      src={url}
                      alt={`Output ${idx + 1}`}
                      className="w-full h-full object-contain bg-muted/30"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-square w-full max-w-md mx-auto bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                {history.status === "failed" ? "생성 실패" : "출력 이미지 없음"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>사용된 파라미터</CardTitle>
          </CardHeader>
          <CardContent>
            {editableParams.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(getGroupedParams()).map(([category, params]) => (
                  <div key={category} className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      {CATEGORY_DISPLAY_NAMES[category] || category}
                    </h4>
                    <div className="space-y-2">
                      {params.map(({ key, value, label }) => (
                        <div
                          key={key}
                          className="flex justify-between items-center p-2 rounded-lg bg-muted/30"
                        >
                          <span className="text-sm text-muted-foreground truncate flex-1 mr-2">
                            {label}
                          </span>
                          <span className="font-mono text-sm font-medium">
                            {getParamDisplayValue(key, value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-64 text-sm">
                {JSON.stringify(history.params, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>메타 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Job ID</span>
              <span className="font-mono text-sm">{history.jobId || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">실행 시간</span>
              <span>{new Date(history.executedAt).toLocaleString("ko-KR")}</span>
            </div>
            {history.completedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">완료 시간</span>
                <span>{new Date(history.completedAt).toLocaleString("ko-KR")}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {history.errorMessage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">에러 메시지</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
                {history.errorMessage}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
