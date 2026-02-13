"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { ParamEditor } from "@/components/workflow/ParamEditor";
import { useProjectPageStore } from "@/stores/useProjectPageStore";
import type { ParamConfig } from "@/types";

interface ParamSettingsPanelProps {
  params: ParamConfig[] | null;
}

export function ParamSettingsPanel({ params }: ParamSettingsPanelProps) {
  const { paramValues, updateParamValue } = useProjectPageStore();

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings className="h-4 w-4" />
          파라미터 설정
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {params && params.length > 0 ? (
          <ParamEditor
            params={params}
            values={paramValues}
            onChange={updateParamValue}
          />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            파라미터가 없습니다
          </p>
        )}
      </CardContent>
    </Card>
  );
}
