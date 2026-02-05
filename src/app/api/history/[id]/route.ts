import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPresignedUrl, getPresignedUrls, deleteObjects } from "@/lib/s3";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/history/[id] - 히스토리 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const history = await prisma.testHistory.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!history) {
      return NextResponse.json(
        { error: "History not found" },
        { status: 404 }
      );
    }

    // S3 URL 변환
    let inputImageUrl = history.inputImageUrl;
    let outputImageUrls = history.outputImageUrls as string[] | null;

    if (inputImageUrl && !inputImageUrl.startsWith("http")) {
      inputImageUrl = await getPresignedUrl(inputImageUrl);
    }

    if (outputImageUrls && outputImageUrls.length > 0) {
      const s3Keys = outputImageUrls.filter((url) => !url.startsWith("http"));
      if (s3Keys.length > 0) {
        outputImageUrls = await getPresignedUrls(s3Keys);
      }
    }

    return NextResponse.json({
      ...history,
      inputImageUrl,
      outputImageUrls,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}

// PATCH /api/history/[id] - 히스토리 업데이트 (최종 선택 등)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isSelected } = body;

    const history = await prisma.testHistory.findUnique({
      where: { id },
    });

    if (!history) {
      return NextResponse.json(
        { error: "History not found" },
        { status: 404 }
      );
    }

    // isSelected가 true로 설정되면, 같은 프로젝트의 다른 히스토리는 false로
    if (isSelected === true) {
      await prisma.testHistory.updateMany({
        where: {
          projectId: history.projectId,
          id: { not: id },
        },
        data: { isSelected: false },
      });
    }

    const updated = await prisma.testHistory.update({
      where: { id },
      data: { isSelected },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating history:", error);
    return NextResponse.json(
      { error: "Failed to update history" },
      { status: 500 }
    );
  }
}

// DELETE /api/history/[id] - 히스토리 삭제/취소
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const history = await prisma.testHistory.findUnique({
      where: { id },
    });

    if (!history) {
      return NextResponse.json(
        { error: "History not found" },
        { status: 404 }
      );
    }

    // pending/processing 상태면 cancelled로 변경 (Worker에서 처리)
    if (history.status === "pending" || history.status === "processing") {
      await prisma.testHistory.update({
        where: { id },
        data: { status: "cancelled" },
      });
      return NextResponse.json({ success: true, cancelled: true });
    }

    // completed/failed/cancelled 상태면 실제 삭제
    // S3 이미지 삭제
    const s3KeysToDelete: string[] = [];

    // 입력 이미지 (S3 키인 경우만)
    if (history.inputImageUrl && !history.inputImageUrl.startsWith("http")) {
      s3KeysToDelete.push(history.inputImageUrl);
    }

    // 출력 이미지들 (S3 키인 경우만)
    const outputUrls = history.outputImageUrls as string[] | null;
    if (outputUrls) {
      for (const url of outputUrls) {
        if (!url.startsWith("http")) {
          s3KeysToDelete.push(url);
        }
      }
    }

    // S3 삭제 (실패해도 DB는 삭제)
    if (s3KeysToDelete.length > 0) {
      try {
        await deleteObjects(s3KeysToDelete);
      } catch (s3Error) {
        console.error("Failed to delete S3 objects:", s3Error);
      }
    }

    // DB 레코드 삭제
    await prisma.testHistory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting history:", error);
    return NextResponse.json(
      { error: "Failed to delete history" },
      { status: 500 }
    );
  }
}
