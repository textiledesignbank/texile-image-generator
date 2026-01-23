"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HistoryCard } from "@/components/history/HistoryCard";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { TestHistory, PaginatedResponse, WorkflowTemplate } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WorkflowHistoryPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [workflow, setWorkflow] = useState<WorkflowTemplate | null>(null);
  const [histories, setHistories] = useState<TestHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [workflowRes, historyRes] = await Promise.all([
        fetch(`/api/workflows/${id}`),
        fetch(`/api/history?workflowId=${id}`),
      ]);

      if (workflowRes.ok) {
        const data = await workflowRes.json();
        setWorkflow(data);
      }

      if (historyRes.ok) {
        const data: PaginatedResponse<TestHistory> = await historyRes.json();
        setHistories(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">로딩 중...</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {workflow?.name || "워크플로우"} 히스토리
            </h1>
            <p className="text-muted-foreground">
              총 {histories.length}개의 테스트 기록
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

      {histories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          테스트 히스토리가 없습니다
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {histories.map((history) => (
            <HistoryCard
              key={history.id}
              history={history}
              onClick={() => router.push(`/history/${history.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
