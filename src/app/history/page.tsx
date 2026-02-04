"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HistoryCard } from "@/components/history/HistoryCard";
import { ArrowLeft, RefreshCw, Layers } from "lucide-react";
import type { TestHistory, PaginatedResponse, WorkflowTemplate } from "@/types";

export default function HistoryPage() {
  const router = useRouter();
  const [histories, setHistories] = useState<TestHistory[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [historyCounts, setHistoryCounts] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("all");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("all");
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const fetchWorkflows = async () => {
    try {
      const res = await fetch("/api/workflows");
      const data: PaginatedResponse<WorkflowTemplate> = await res.json();
      setWorkflows(data.data);
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
    }
  };

  // 워크플로우별 카운트를 위한 전체 히스토리 로드 (초기 1회만)
  const fetchAllHistoryCounts = async () => {
    try {
      const res = await fetch("/api/history?pageSize=1000");
      const data: PaginatedResponse<TestHistory> = await res.json();

      // 워크플로우별 카운트 계산
      const counts: Record<string, number> = {};
      data.data.forEach((h) => {
        if (h.workflowId) {
          counts[h.workflowId] = (counts[h.workflowId] || 0) + 1;
        }
      });
      setHistoryCounts(counts);
      setTotalCount(data.data.length);
    } catch (error) {
      console.error("Failed to fetch history counts:", error);
    }
  };

  const fetchHistories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (selectedWorkflowId !== "all") params.set("workflowId", selectedWorkflowId);

      const res = await fetch(`/api/history?${params}`);
      const data: PaginatedResponse<TestHistory> = await res.json();
      setHistories(data.data);
    } catch (error) {
      console.error("Failed to fetch histories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
    fetchAllHistoryCounts();
  }, []);

  useEffect(() => {
    fetchHistories();
  }, [status, selectedWorkflowId]);

  // 자동 새로고침 (처리중인 작업이 있을 때)
  useEffect(() => {
    const hasProcessing = histories.some(
      (h) => h.status === "pending" || h.status === "processing"
    );

    if (hasProcessing) {
      const interval = setInterval(fetchHistories, 5000);
      return () => clearInterval(interval);
    }
  }, [histories]);

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      const res = await fetch(`/api/history/${deleteDialog}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteDialog(null);
        fetchHistories();
        fetchAllHistoryCounts(); // 카운트도 갱신
      }
    } catch (error) {
      console.error("Failed to delete history:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">테스트 히스토리</h1>
        </div>
        <div className="flex items-center gap-4">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="pending">대기중</SelectItem>
              <SelectItem value="processing">처리중</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
              <SelectItem value="failed">실패</SelectItem>
              <SelectItem value="cancelled">취소됨</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchHistories}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 워크플로우별 탭 */}
      <div className="mb-6">
        <Tabs value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="all" className="gap-1">
              <Layers className="h-4 w-4" />
              전체
              <span className="text-xs text-muted-foreground ml-1">
                ({totalCount})
              </span>
            </TabsTrigger>
            {workflows.map((workflow) => (
              <TabsTrigger key={workflow.id} value={workflow.id} className="gap-1">
                {workflow.name}
                <span className="text-xs text-muted-foreground ml-1">
                  ({historyCounts[workflow.id] || 0})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
      ) : histories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {selectedWorkflowId !== "all" ? (
            <>
              선택한 워크플로우의 히스토리가 없습니다
              <br />
              <Button
                variant="link"
                className="mt-2"
                onClick={() => setSelectedWorkflowId("all")}
              >
                전체 히스토리 보기
              </Button>
            </>
          ) : (
            "테스트 히스토리가 없습니다"
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {histories.map((history) => (
            <HistoryCard
              key={history.id}
              history={history}
              onClick={() => router.push(`/history/${history.id}`)}
              onDelete={(id) => setDeleteDialog(id)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>히스토리 삭제</DialogTitle>
            <DialogDescription>
              이 테스트 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
