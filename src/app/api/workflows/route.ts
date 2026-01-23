import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractEditableParams, detectModelType } from "@/lib/workflow-parser";
import type { CreateWorkflowRequest, ComfyUIWorkflow } from "@/types";

// GET /api/workflows - 전체 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const modelType = searchParams.get("modelType");
    const search = searchParams.get("search");

    const where = {
      ...(modelType && { modelType }),
      ...(search && {
        name: {
          contains: search,
        },
      }),
    };

    const [data, total] = await Promise.all([
      prisma.workflowTemplate.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
        include: {
          _count: {
            select: { histories: true },
          },
        },
      }),
      prisma.workflowTemplate.count({ where }),
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}

// POST /api/workflows - 새 워크플로우 생성
export async function POST(request: NextRequest) {
  try {
    const body: CreateWorkflowRequest = await request.json();
    const { name, modelType, baseWorkflow, editableParams, sourceTemplateId } = body;

    // 복제인 경우 원본에서 데이터 가져오기
    if (sourceTemplateId) {
      const source = await prisma.workflowTemplate.findUnique({
        where: { id: sourceTemplateId },
      });

      if (!source) {
        return NextResponse.json(
          { error: "Source template not found" },
          { status: 404 }
        );
      }

      const workflow = await prisma.workflowTemplate.create({
        data: {
          name: name || `${source.name}_copy`,
          modelType: source.modelType,
          baseWorkflow: source.baseWorkflow,
          editableParams: source.editableParams,
        },
      });

      return NextResponse.json(workflow, { status: 201 });
    }

    // 새로 생성
    if (!name || !baseWorkflow) {
      return NextResponse.json(
        { error: "Name and baseWorkflow are required" },
        { status: 400 }
      );
    }

    // 모델 타입 자동 감지 (제공되지 않은 경우)
    const detectedModelType = modelType || detectModelType(baseWorkflow);

    // 파라미터 자동 추출 (제공되지 않은 경우)
    const detectedParams = editableParams || extractEditableParams(baseWorkflow);

    const workflow = await prisma.workflowTemplate.create({
      data: {
        name,
        modelType: detectedModelType,
        baseWorkflow: baseWorkflow as object,
        editableParams: detectedParams as object[],
      },
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error("Error creating workflow:", error);
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 }
    );
  }
}
