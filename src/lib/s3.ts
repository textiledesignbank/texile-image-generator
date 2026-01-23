import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const bucketName = process.env.S3_BUCKET_NAME || "dev-tdb-storage";
const storagePath = process.env.S3_STORAGE_PATH || "tdb/storage/uploads";

// 이미지 업로드 (Base64)
export async function uploadBase64Image(
  base64Data: string,
  fileName: string
): Promise<string> {
  // Base64 데이터에서 prefix 제거 (data:image/png;base64, 등)
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Content, "base64");

  // Content-Type 추출
  const contentTypeMatch = base64Data.match(/^data:(image\/\w+);base64,/);
  const contentType = contentTypeMatch ? contentTypeMatch[1] : "image/png";

  const key = `${storagePath}/inputs/${Date.now()}-${fileName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return key;
}

// S3 URL 생성 (Presigned URL)
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

// S3 Public URL 생성
export function getPublicUrl(key: string): string {
  return `https://${bucketName}.s3.${process.env.AWS_REGION || "ap-northeast-2"}.amazonaws.com/${key}`;
}

// 여러 이미지 URL 생성
export async function getPresignedUrls(
  keys: string[],
  expiresIn: number = 3600
): Promise<string[]> {
  return Promise.all(keys.map((key) => getPresignedUrl(key, expiresIn)));
}

// S3 객체 삭제
export async function deleteObject(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}

// 여러 S3 객체 삭제
export async function deleteObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  // S3 DeleteObjects는 한 번에 최대 1000개까지 삭제 가능
  const chunks = [];
  for (let i = 0; i < keys.length; i += 1000) {
    chunks.push(keys.slice(i, i + 1000));
  }

  for (const chunk of chunks) {
    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: chunk.map((key) => ({ Key: key })),
        },
      })
    );
  }
}
