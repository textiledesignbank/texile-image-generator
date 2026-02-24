import sharp from "sharp";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, bucketName } from "@/lib/s3";

const THUMBNAIL_MAX_WIDTH = 400;
const THUMBNAIL_QUALITY = 70;

/**
 * S3 키를 썸네일 키로 변환
 * e.g., inputs/1708000-photo.png → inputs/thumbs/1708000-photo.webp
 */
function toThumbnailKey(originalKey: string): string {
  const lastSlash = originalKey.lastIndexOf("/");
  const dir = originalKey.substring(0, lastSlash);
  const filename = originalKey.substring(lastSlash + 1);
  const nameWithoutExt = filename.replace(/\.[^.]+$/, "");
  return `${dir}/thumbs/${nameWithoutExt}.webp`;
}

/**
 * S3 원본 이미지로부터 썸네일을 생성하여 S3에 업로드
 * @returns 썸네일 S3 키
 */
export async function generateThumbnail(originalS3Key: string): Promise<string> {
  // 1. S3에서 원본 다운로드
  const getCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: originalS3Key,
  });
  const response = await s3Client.send(getCommand);

  if (!response.Body) {
    throw new Error(`Empty response from S3 for key: ${originalS3Key}`);
  }

  const originalBuffer = Buffer.from(await response.Body.transformToByteArray());

  // 2. sharp로 리사이즈 (max width 400px, WebP, quality 70)
  const thumbnailBuffer = await sharp(originalBuffer)
    .resize({ width: THUMBNAIL_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: THUMBNAIL_QUALITY })
    .toBuffer();

  // 3. S3에 썸네일 업로드
  const thumbnailKey = toThumbnailKey(originalS3Key);
  const putCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: thumbnailKey,
    Body: thumbnailBuffer,
    ContentType: "image/webp",
  });
  await s3Client.send(putCommand);

  return thumbnailKey;
}

/**
 * 여러 이미지의 썸네일을 병렬 생성
 */
export async function generateThumbnails(originalS3Keys: string[]): Promise<string[]> {
  return Promise.all(originalS3Keys.map(generateThumbnail));
}
