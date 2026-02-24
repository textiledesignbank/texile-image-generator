import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const bucketName = process.env.S3_BUCKET_NAME || "dev-tdb-storage";
const storagePath = process.env.S3_STORAGE_PATH || "tdb/storage/uploads";

// GET /api/image/proxy?key=tdb/storage/uploads/outputs/123.png
export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
    }

    // key 경로 검증: storagePath 내 파일만 허용
    if (!key.startsWith(storagePath)) {
      return NextResponse.json({ error: "Invalid key path" }, { status: 403 });
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return NextResponse.json({ error: "Empty response from S3" }, { status: 404 });
    }

    const byteArray = await response.Body.transformToByteArray();

    return new NextResponse(Buffer.from(byteArray), {
      headers: {
        "Content-Type": response.ContentType || "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: unknown) {
    const s3Error = error as { name?: string };
    if (s3Error.name === "NoSuchKey") {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    console.error("Image proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}
