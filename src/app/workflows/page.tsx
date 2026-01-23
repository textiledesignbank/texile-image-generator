"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkflowCard } from "@/components/workflow/WorkflowCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { WorkflowWithCount, PaginatedResponse } from "@/types";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

const PAGE_SIZE = 12;

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modelType, setModelType] = useState<string>("all");
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", PAGE_SIZE.toString());
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (modelType !== "all") params.set("modelType", modelType);

      const res = await fetch(`/api/workflows?${params}`);
      const data: PaginatedResponse<WorkflowWithCount> = await res.json();
      setWorkflows(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, modelType]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  // 검색어나 필터 변경 시 첫 페이지로
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, modelType]);

  const handleEdit = (id: string) => {
    router.push(`/workflows/${id}`);
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/workflows/${id}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        fetchWorkflows();
      }
    } catch (error) {
      console.error("Failed to duplicate workflow:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      const res = await fetch(`/api/workflows/${deleteDialog}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteDialog(null);
        fetchWorkflows();
      }
    } catch (error) {
      console.error("Failed to delete workflow:", error);
    }
  };

  const handleGenerate = (id: string) => {
    router.push(`/workflows/${id}/generate`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">워크플로우</h1>
        <Button onClick={() => router.push("/workflows/new")}>
          <Plus className="h-4 w-4 mr-2" />
          새 워크플로우
        </Button>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="워크플로우 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={modelType} onValueChange={setModelType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="모델 타입" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="sdxl">SDXL</SelectItem>
            <SelectItem value="sd15">SD 1.5</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          총 <span className="font-medium text-foreground">{total}</span>개
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          워크플로우가 없습니다
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={(id) => setDeleteDialog(id)}
                onGenerate={handleGenerate}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>워크플로우 삭제</DialogTitle>
            <DialogDescription>
              이 워크플로우를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
