import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendGenerateJob } from "@/lib/sqs";
import { uploadBase64Image } from "@/lib/s3";
import { applyParamsToWorkflow, injectBase64Image } from "@/lib/workflow-parser";
import type { GenerateRequest, ComfyUIWorkflow, ParamConfig } from "@/types";

// POST /api/generate - 이미지 생성 요청
export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { workflowId, params, inputImageBase64 } = body;

    // 워크플로우 조회
    const workflow = await prisma.workflowTemplate.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // 입력 이미지 S3 업로드 (있는 경우)
    let inputImageS3Key: string | undefined;
    console.log(`[Generate] inputImageBase64 exists: ${!!inputImageBase64}, length: ${inputImageBase64?.length || 0}`);
    if (inputImageBase64) {
      inputImageS3Key = await uploadBase64Image(
        inputImageBase64,
        `input-${Date.now()}.png`
      );
      console.log(`[Generate] Uploaded to S3: ${inputImageS3Key}`);
    }

    // 파라미터 적용
    const baseWorkflow = workflow.baseWorkflow as unknown as ComfyUIWorkflow;
    const editableParams = workflow.editableParams as unknown as ParamConfig[];

    const processedWorkflow = applyParamsToWorkflow(baseWorkflow, editableParams, params);
    // Note: Base64 이미지는 SQS 메시지 크기 제한(256KB) 때문에 워크플로우에 주입하지 않음
    // Worker에서 S3 키를 사용해 이미지를 다운로드 후 워크플로우에 주입해야 함

    // 히스토리 레코드 생성
    const history = await prisma.testHistory.create({
      data: {
        workflowId,
        params: params as object,
        inputImageUrl: inputImageS3Key || null,
        status: "pending",
      },
    });

    // SQS로 작업 전송
    console.log(`[Generate] Sending to SQS with inputImageS3Key: ${inputImageS3Key || 'NONE'}`);
    const jobId = await sendGenerateJob(
      history.id,
      processedWorkflow,
      params,
      inputImageS3Key
    );
    console.log(`[Generate] Job sent: ${jobId}`);

    // jobId 업데이트
    await prisma.testHistory.update({
      where: { id: history.id },
      data: { jobId, status: "processing" },
    });

    return NextResponse.json({
      historyId: history.id,
      jobId,
      status: "processing",
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
