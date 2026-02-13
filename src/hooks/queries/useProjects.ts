import { useQuery } from "@tanstack/react-query";
import { fetchProjects, type FetchProjectsParams } from "@/lib/api";

export const projectsKeys = {
  all: ["projects"] as const,
  list: (params: FetchProjectsParams) => ["projects", "list", params] as const,
};

export function useProjects(params: FetchProjectsParams = {}) {
  return useQuery({
    queryKey: projectsKeys.list(params),
    queryFn: () => fetchProjects(params),
  });
}
