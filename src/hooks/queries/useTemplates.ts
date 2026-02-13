import { useQuery } from "@tanstack/react-query";
import { fetchTemplates } from "@/lib/api";

export const templateKeys = {
  all: ["templates"] as const,
  list: (modelType: string) => ["templates", modelType] as const,
};

export function useTemplates(modelType: string) {
  return useQuery({
    queryKey: templateKeys.list(modelType),
    queryFn: () => fetchTemplates(modelType),
    enabled: !!modelType,
  });
}
