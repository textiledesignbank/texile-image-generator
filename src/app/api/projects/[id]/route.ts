import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { UpdateProjectRequest } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id] - 프로젝트 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        histories: {
          orderBy: { executedAt: "desc" },
          take: 50,
        },
        _count: {
          select: { histories: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - 프로젝트 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: UpdateProjectRequest = await request.json();

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.sdxlWorkflow !== undefined) updateData.sdxlWorkflow = body.sdxlWorkflow as object;
    if (body.sdxlParams !== undefined) updateData.sdxlParams = body.sdxlParams as object[];
    if (body.sd15Workflow !== undefined) updateData.sd15Workflow = body.sd15Workflow as object;
    if (body.sd15Params !== undefined) updateData.sd15Params = body.sd15Params as object[];

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - 프로젝트 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
