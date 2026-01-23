"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { TestHistory, PaginatedResponse } from "@/types";

export default function HistoryPage() {
  const router = useRouter();
  const [histories, setHistories] = useState<TestHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("all");
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const fetchHistories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);

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
    fetchHistories();
  }, [status]);

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
              <SelectItem value="all">전체</SelectItem>
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

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
      ) : histories.length === 0 ? (
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
