import { useMutation } from "@tanstack/react-query";
import { fetchTemplateValues } from "@/lib/api";

interface ApplyTemplateParams {
  name: string;
  projectId: string;
  modelType: string;
}

export function useApplyTemplate() {
  return useMutation({
    mutationFn: ({ name, projectId, modelType }: ApplyTemplateParams) =>
      fetchTemplateValues(name, projectId, modelType),
  });
}
