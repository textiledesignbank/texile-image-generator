import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { UpdateWorkflowRequest } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/workflows/[id] - 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const workflow = await prisma.workflowTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { histories: true },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Error fetching workflow:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow" },
      { status: 500 }
    );
  }
}

// PUT /api/workflows/[id] - 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: UpdateWorkflowRequest = await request.json();
    const { name, baseWorkflow, editableParams } = body;

    const existing = await prisma.workflowTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    const workflow = await prisma.workflowTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(baseWorkflow && { baseWorkflow: baseWorkflow as object }),
        ...(editableParams && { editableParams: editableParams as object[] }),
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Error updating workflow:", error);
    return NextResponse.json(
      { error: "Failed to update workflow" },
      { status: 500 }
    );
  }
}

// DELETE /api/workflows/[id] - 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existing = await prisma.workflowTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    await prisma.workflowTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return NextResponse.json(
      { error: "Failed to delete workflow" },
      { status: 500 }
    );
  }
}
