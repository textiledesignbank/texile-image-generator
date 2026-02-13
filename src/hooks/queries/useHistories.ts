import { useQuery } from "@tanstack/react-query";
import { fetchHistories, fetchHistory, type FetchHistoriesParams } from "@/lib/api";

export const historyKeys = {
  all: ["histories"] as const,
  list: (params: FetchHistoriesParams) => ["histories", "list", params] as const,
  detail: (id: string) => ["histories", id] as const,
};

export function useHistories(params: FetchHistoriesParams = {}) {
  return useQuery({
    queryKey: historyKeys.list(params),
    queryFn: () => fetchHistories(params),
    enabled: !!params.projectId,
  });
}

export function useHistoryPolling(historyId: string | null) {
  return useQuery({
    queryKey: historyKeys.detail(historyId!),
    queryFn: () => fetchHistory(historyId!),
    enabled: !!historyId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      if (data.status === "completed" || data.status === "failed" || data.status === "cancelled") {
        return false;
      }
      return 2000;
    },
  });
}
