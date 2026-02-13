import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateImage } from "@/lib/api";
import { historyKeys } from "@/hooks/queries";
import type { GenerateRequest } from "@/types";

export function useGenerate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GenerateRequest) => generateImage(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: historyKeys.list({ projectId: variables.projectId }),
      });
    },
  });
}
