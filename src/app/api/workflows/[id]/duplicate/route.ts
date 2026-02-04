import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/workflows/[id]/duplicate - 워크플로우 복제
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { name } = body;

    const source = await prisma.workflowTemplate.findUnique({
      where: { id },
    });

    if (!source) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    const workflow = await prisma.workflowTemplate.create({
      data: {
        name: name || `${source.name}_copy`,
        modelType: source.modelType,
        baseWorkflow: source.baseWorkflow as object,
        editableParams: source.editableParams as object,
      },
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error("Error duplicating workflow:", error);
    return NextResponse.json(
      { error: "Failed to duplicate workflow" },
      { status: 500 }
    );
  }
}
