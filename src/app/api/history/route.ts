import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPresignedUrls, getPresignedUrl } from "@/lib/s3";

// GET /api/history - 히스토리 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const workflowId = searchParams.get("workflowId");
    const status = searchParams.get("status");

    const where = {
      ...(workflowId && { workflowId }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      prisma.testHistory.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { executedAt: "desc" },
        include: {
          workflow: {
            select: {
              id: true,
              name: true,
              modelType: true,
            },
          },
        },
      }),
      prisma.testHistory.count({ where }),
    ]);

    // S3 URL 변환
    const dataWithUrls = await Promise.all(
      data.map(async (item) => {
        let inputImageUrl = item.inputImageUrl;
        let outputImageUrls = item.outputImageUrls as string[] | null;

        // Presigned URL 생성
        if (inputImageUrl && !inputImageUrl.startsWith("http")) {
          inputImageUrl = await getPresignedUrl(inputImageUrl);
        }

        if (outputImageUrls && outputImageUrls.length > 0) {
          const needsPresigning = outputImageUrls.some(
            (url) => !url.startsWith("http")
          );
          if (needsPresigning) {
            outputImageUrls = await getPresignedUrls(
              outputImageUrls.filter((url) => !url.startsWith("http"))
            );
          }
        }

        return {
          ...item,
          inputImageUrl,
          outputImageUrls,
        };
      })
    );

    return NextResponse.json({
      data: dataWithUrls,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
