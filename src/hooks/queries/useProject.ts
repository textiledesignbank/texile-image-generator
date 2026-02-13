import { useQuery } from "@tanstack/react-query";
import { fetchProject } from "@/lib/api";

export const projectKeys = {
  all: ["project"] as const,
  detail: (id: string) => ["project", id] as const,
};

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => fetchProject(id),
    enabled: !!id,
  });
}
