"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Pencil, Trash2, Play } from "lucide-react";
import type { WorkflowWithCount } from "@/types";

interface WorkflowCardProps {
  workflow: WorkflowWithCount;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onGenerate: (id: string) => void;
}

export function WorkflowCard({
  workflow,
  onEdit,
  onDuplicate,
  onDelete,
  onGenerate,
}: WorkflowCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{workflow.name}</CardTitle>
          <Badge variant={workflow.modelType === "sdxl" ? "default" : "secondary"}>
            {workflow.modelType.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="text-sm text-muted-foreground">
          <p>테스트 횟수: {workflow._count?.histories || 0}회</p>
          <p className="mt-1">
            수정일: {new Date(workflow.updatedAt).toLocaleDateString("ko-KR")}
          </p>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={() => onGenerate(workflow.id)}
        >
          <Play className="h-4 w-4" />
          테스트
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(workflow.id)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDuplicate(workflow.id)}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(workflow.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
