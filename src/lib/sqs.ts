import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { v4 as uuidv4 } from "uuid";
import type { SQSJobMessage, ComfyUIWorkflow } from "@/types";

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const queueUrl = process.env.SQS_QUEUE_URL!;

// FIFO 큐인지 확인
const isFifoQueue = queueUrl.endsWith(".fifo");

// SQS로 작업 전송
export async function sendGenerateJob(
  historyId: string,
  workflow: ComfyUIWorkflow,
  params: Record<string, unknown>,
  inputImageS3Key?: string
): Promise<string> {
  const jobId = uuidv4();

  const message: SQSJobMessage = {
    jobId,
    historyId,
    workflow,
    params,
    inputImageS3Key,
  };

  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(message),
    // FIFO 큐 전용 파라미터
    ...(isFifoQueue && {
      MessageGroupId: "image-generation",
      MessageDeduplicationId: jobId,
    }),
  });

  await sqsClient.send(command);

  return jobId;
}
