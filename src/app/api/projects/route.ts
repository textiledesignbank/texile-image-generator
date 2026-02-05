import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { CreateProjectRequest } from "@/types";

// GET /api/projects - 프로젝트 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search");

    const where = {
      ...(search && {
        name: {
          contains: search,
        },
      }),
    };

    const [data, total] = await Promise.all([
      prisma.project.findMany({
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
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - 새 프로젝트 생성
export async function POST(request: NextRequest) {
  try {
    const body: CreateProjectRequest = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // 기본 워크플로우 템플릿 조회 (SDXL: animal, SD1.5: floral)
    const [sdxlTemplate, sd15Template] = await Promise.all([
      prisma.workflowTemplate.findFirst({
        where: { modelType: "sdxl", name: { contains: "animal" } },
      }),
      prisma.workflowTemplate.findFirst({
        where: { modelType: "sd15", name: { contains: "floral" } },
      }),
    ]);

    const project = await prisma.project.create({
      data: {
        name,
        sdxlWorkflow: sdxlTemplate?.baseWorkflow ?? undefined,
        sdxlParams: sdxlTemplate?.editableParams ?? undefined,
        sd15Workflow: sd15Template?.baseWorkflow ?? undefined,
        sd15Params: sd15Template?.editableParams ?? undefined,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
