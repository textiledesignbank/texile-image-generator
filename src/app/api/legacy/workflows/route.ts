import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/legacy/workflows - 레거시 워크플로우 템플릿 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const modelType = searchParams.get("modelType");

    const where = {
      ...(modelType && { modelType }),
    };

    const [data, total] = await Promise.all([
      prisma.workflowTemplate.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
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
    console.error("Error fetching legacy workflows:", error);
    return NextResponse.json(
      { error: "Failed to fetch legacy workflows" },
      { status: 500 }
    );
  }
}
