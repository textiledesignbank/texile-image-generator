"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectPageStore } from "@/stores/useProjectPageStore";
import type { ModelType } from "@/types";

interface ModelSelectorProps {
  sdxlAvailable: boolean;
  sd15Available: boolean;
}

export function ModelSelector({ sdxlAvailable, sd15Available }: ModelSelectorProps) {
  const { modelType, setModelType } = useProjectPageStore();

  return (
    <Card>
      <CardContent className="pt-4">
        <Tabs value={modelType} onValueChange={(v) => setModelType(v as ModelType)}>
          <TabsList className="w-full">
            <TabsTrigger value="sdxl" className="flex-1" disabled={!sdxlAvailable}>
              SDXL
            </TabsTrigger>
            <TabsTrigger value="sd15" className="flex-1" disabled={!sd15Available}>
              SD1.5
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardContent>
    </Card>
  );
}
