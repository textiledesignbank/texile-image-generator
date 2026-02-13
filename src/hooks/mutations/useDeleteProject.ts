import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProject } from "@/lib/api";
import { projectsKeys } from "@/hooks/queries";

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.all });
    },
  });
}
