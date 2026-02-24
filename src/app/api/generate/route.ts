import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendGenerateJob } from "@/lib/sqs";
import { applyParamsToWorkflow } from "@/lib/workflow-parser";
import { generateThumbnail } from "@/lib/thumbnail";
import type { GenerateRequest, ComfyUIWorkflow, ParamConfig } from "@/types";

// POST /api/generate - 이미지 생성 요청
export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { projectId, modelType, params, inputImageS3Key } = body;

    // 프로젝트 조회
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // 모델 타입에 따른 워크플로우와 파라미터 선택
    const workflow = modelType === "sdxl"
      ? project.sdxlWorkflow
      : project.sd15Workflow;

    const editableParams = modelType === "sdxl"
      ? project.sdxlParams
      : project.sd15Params;

    if (!workflow) {
      return NextResponse.json(
        { error: `${modelType.toUpperCase()} workflow not configured for this project` },
        { status: 400 }
      );
    }

    // 파라미터 적용
    const baseWorkflow = workflow as unknown as ComfyUIWorkflow;
    const paramConfigs = (editableParams || []) as unknown as ParamConfig[];

    const processedWorkflow = applyParamsToWorkflow(baseWorkflow, paramConfigs, params);

    // 입력 이미지 썸네일 생성
    let inputThumbnailUrl: string | null = null;
    if (inputImageS3Key) {
      try {
        inputThumbnailUrl = await generateThumbnail(inputImageS3Key);
      } catch (e) {
        console.error("Input thumbnail generation failed:", e);
      }
    }

    // 히스토리 레코드 생성
    const history = await prisma.testHistory.create({
      data: {
        projectId,
        modelType,
        params: params as object,
        inputImageUrl: inputImageS3Key || null,
        inputThumbnailUrl,
        status: "pending",
        isSelected: false,
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
