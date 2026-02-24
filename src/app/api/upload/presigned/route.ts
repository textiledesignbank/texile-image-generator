import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl } from "@/lib/s3";

const storagePath = process.env.S3_STORAGE_PATH || "tdb/storage/uploads";

// POST /api/upload/presigned - Presigned PUT URL 생성
export async function POST(request: NextRequest) {
  try {
    const { fileName, contentType } = await request.json();

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "fileName and contentType are required" },
        { status: 400 }
      );
    }

    const s3Key = `${storagePath}/inputs/${Date.now()}-${fileName}`;
    const uploadUrl = await getPresignedUploadUrl(s3Key, contentType);

    return NextResponse.json({ uploadUrl, s3Key });
  } catch (error) {
    console.error("Error creating presigned upload URL:", error);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}
