"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText } from "lucide-react";
import { useTemplates } from "@/hooks/queries";
import { useApplyTemplate } from "@/hooks/mutations";
import { useProjectPageStore } from "@/stores/useProjectPageStore";

interface TemplateSelectorProps {
  projectId: string;
}

export function TemplateSelector({ projectId }: TemplateSelectorProps) {
  const { modelType, selectedTemplate, setSelectedTemplate, mergeParamValues } =
    useProjectPageStore();
  const { data: templates = [] } = useTemplates(modelType);
  const applyTemplate = useApplyTemplate();

  const handleTemplateSelect = async (name: string) => {
    setSelectedTemplate(name);
    try {
      const result = await applyTemplate.mutateAsync({
        name,
        projectId,
        modelType,
      });
      if (result.values && Object.keys(result.values).length > 0) {
        mergeParamValues(result.values);
      }
    } catch (error) {
      console.error("Failed to apply template:", error);
    }
  };

  if (templates.length === 0) return null;

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" />
          템플릿 파라미터
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Select
          value={selectedTemplate}
          onValueChange={handleTemplateSelect}
          disabled={applyTemplate.isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="템플릿을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((t) => (
              <SelectItem key={t.name} value={t.name}>
                {t.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
