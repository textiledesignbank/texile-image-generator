import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ParamConfig } from "@/types";

// GET /api/templates/[name]?projectId=xxx&modelType=sdxl
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");
    const modelType = searchParams.get("modelType");

    if (!projectId || !modelType) {
      return NextResponse.json(
        { error: "projectId and modelType are required" },
        { status: 400 }
      );
    }

    const template = await prisma.workflowTemplate.findFirst({
      where: { name, modelType },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // 프로젝트의 ParamConfig 가져오기
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const paramConfigs = (
      modelType === "sdxl" ? project.sdxlParams : project.sd15Params
    ) as ParamConfig[] | null;

    if (!paramConfigs) {
      return NextResponse.json({ values: {} });
    }

    // 템플릿의 editable_params에서 매칭되는 값 추출
    const templateParams = template.editableParams as unknown as ParamConfig[];
    const values: Record<string, unknown> = {};

    paramConfigs.forEach((pc) => {
      const key = `${pc.nodeId}.${pc.paramPath}`;
      const match = templateParams.find(
        (tp) => tp.nodeId === pc.nodeId && tp.paramPath === pc.paramPath
      );
      if (match) {
        values[key] = match.defaultValue;
      }
    });

    return NextResponse.json({ values });
  } catch (error) {
    console.error("Error fetching template params:", error);
    return NextResponse.json(
      { error: "Failed to fetch template params" },
      { status: 500 }
    );
  }
}
