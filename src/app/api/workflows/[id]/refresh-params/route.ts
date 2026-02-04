import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractEditableParams } from "@/lib/workflow-parser";
import type { ComfyUIWorkflow } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/workflows/[id]/refresh-params - 워크플로우 파라미터 재추출
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const workflow = await prisma.workflowTemplate.findUnique({
      where: { id },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // baseWorkflow에서 파라미터 재추출
    const baseWorkflow = workflow.baseWorkflow as unknown as ComfyUIWorkflow;
    const newEditableParams = extractEditableParams(baseWorkflow);

    // DB 업데이트
    const updated = await prisma.workflowTemplate.update({
      where: { id },
      data: {
        editableParams: newEditableParams as object,
      },
    });

    return NextResponse.json({
      message: "Parameters refreshed",
      paramCount: newEditableParams.length,
      params: newEditableParams.map(p => p.displayNameKo),
    });
  } catch (error) {
    console.error("Error refreshing params:", error);
    return NextResponse.json(
      { error: "Failed to refresh params" },
      { status: 500 }
    );
  }
}
