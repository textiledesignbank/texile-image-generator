import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/templates?modelType=sdxl
export async function GET(request: NextRequest) {
  try {
    const modelType = request.nextUrl.searchParams.get("modelType");

    if (!modelType) {
      return NextResponse.json(
        { error: "modelType is required" },
        { status: 400 }
      );
    }

    const templates = await prisma.workflowTemplate.findMany({
      where: { modelType },
      select: { name: true, modelType: true },
      orderBy: { name: "asc" },
    });

    const result = templates.map((t) => ({
      name: t.name,
      displayName: t.name.charAt(0).toUpperCase() + t.name.slice(1),
      modelType: t.modelType,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
