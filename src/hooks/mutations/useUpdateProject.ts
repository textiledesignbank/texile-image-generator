import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProject } from "@/lib/api";
import { projectsKeys, projectKeys } from "@/hooks/queries";
import type { UpdateProjectRequest } from "@/types";

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectRequest }) =>
      updateProject(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: projectsKeys.all });
    },
  });
}
