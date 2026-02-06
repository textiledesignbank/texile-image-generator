"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Plus, FolderOpen, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import type { Project, PaginatedResponse } from "@/types";

const PAGE_SIZE = 10;

type SortBy = "lastTestAt" | "historyCount";
type SortOrder = "asc" | "desc";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<SortBy>("lastTestAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProjects = useCallback(async (p: number, sb: SortBy, so: SortOrder, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        pageSize: String(PAGE_SIZE),
        sortBy: sb,
        sortOrder: so,
      });
      if (q) params.set("search", q);
      const res = await fetch(`/api/projects?${params}`);
      const data: PaginatedResponse<Project> = await res.json();
      setProjects(data.data);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects(page, sortBy, sortOrder, search);
  }, [page, sortBy, sortOrder, search, fetchProjects]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
  };

  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const SortIcon = ({ column }: { column: SortBy }) => {
    if (sortBy !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortOrder === "desc"
      ? <ArrowDown className="h-3 w-3 ml-1" />
      : <ArrowUp className="h-3 w-3 ml-1" />;
  };

  if (loading && projects.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">로딩 중...</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">프로젝트</h1>
          <p className="text-muted-foreground">
            이미지 생성 테스트 프로젝트를 관리합니다
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="검색..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 w-48 h-9"
            />
          </div>
          <Button onClick={() => router.push("/projects/new")}>
            <Plus className="h-4 w-4 mr-2" />
            새 프로젝트
          </Button>
        </div>
      </div>

      {total === 0 && !loading && !search ? (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          {search ? (
            <p className="text-muted-foreground">
              &quot;{search}&quot; 검색 결과가 없습니다
            </p>
          ) : (
            <>
              <p className="text-muted-foreground mb-4">
                아직 프로젝트가 없습니다
              </p>
              <Button onClick={() => router.push("/projects/new")}>
                <Plus className="h-4 w-4 mr-2" />
                첫 프로젝트 만들기
              </Button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>프로젝트 이름</TableHead>
                  <TableHead>모델</TableHead>
                  <TableHead
                    className="text-center cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort("historyCount")}
                  >
                    <div className="flex items-center justify-center">
                      테스트 수
                      <SortIcon column="historyCount" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort("lastTestAt")}
                  >
                    <div className="flex items-center justify-end">
                      최근 테스트
                      <SortIcon column="lastTestAt" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => {
                  const lastTestAt = project.histories?.[0]?.executedAt;
                  return (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-muted-foreground" />
                          {project.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {project.sdxlWorkflow && (
                            <span className="px-2 py-0.5 bg-primary/10 rounded text-xs font-medium">
                              SDXL
                            </span>
                          )}
                          {project.sd15Workflow && (
                            <span className="px-2 py-0.5 bg-secondary rounded text-xs font-medium">
                              SD1.5
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {project._count?.histories || 0}개
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {lastTestAt
                          ? new Date(lastTestAt).toLocaleDateString("ko-KR")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                총 {total}개 중 {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
