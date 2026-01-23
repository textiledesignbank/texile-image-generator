import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// 체크포인트 이름으로 모델 타입 감지
function detectModelType(workflow: Record<string, unknown>): "sd15" | "sdxl" {
  for (const node of Object.values(workflow) as Array<{ class_type?: string; inputs?: Record<string, unknown> }>) {
    if (node.class_type === "CheckpointLoaderSimple") {
      const ckptName = node.inputs?.ckpt_name as string;
      if (ckptName?.toLowerCase().includes("xl")) {
        return "sdxl";
      }
      if (ckptName?.toLowerCase().includes("v1-5") || ckptName?.toLowerCase().includes("sd15")) {
        return "sd15";
      }
    }
  }
  return "sdxl";
}

// Sampler 옵션 목록
const SAMPLER_OPTIONS = [
  "euler", "euler_ancestral", "heun", "dpm_2", "dpm_2_ancestral",
  "lms", "dpm_fast", "dpm_adaptive", "dpmpp_2s_ancestral", "dpmpp_sde",
  "dpmpp_sde_gpu", "dpmpp_2m", "dpmpp_2m_sde", "dpmpp_2m_sde_gpu",
  "dpmpp_3m_sde", "dpmpp_3m_sde_gpu", "ddim", "uni_pc", "uni_pc_bh2",
];

// Preprocessor 옵션 목록
const PREPROCESSOR_OPTIONS = [
  "TilePreprocessor", "CannyEdgePreprocessor", "DepthAnythingV2Preprocessor",
  "TTPlanet_TileGF_Preprocessor", "LineartStandardPreprocessor", "AnimeLineArtPreprocessor",
];

// 워크플로우에서 파라미터 추출
function extractEditableParams(workflow: Record<string, unknown>) {
  const params: Array<{
    nodeId: string;
    paramPath: string;
    displayName: string;
    displayNameKo: string;
    description: string;
    type: "number" | "select";
    category: string;
    min?: number;
    max?: number;
    step?: number;
    options?: string[];
    defaultValue: number | string;
  }> = [];

  for (const [nodeId, node] of Object.entries(workflow) as Array<[string, { class_type?: string; inputs?: Record<string, unknown> }]>) {
    // KSampler
    if (node.class_type === "KSampler" && node.inputs) {
      params.push(
        {
          nodeId,
          paramPath: "inputs.seed",
          displayName: "Seed",
          displayNameKo: "시드",
          description: "같은 숫자를 입력하면 동일한 결과를 재현할 수 있어요. 랜덤 버튼으로 새로운 결과를 만들어보세요.",
          type: "number",
          category: "sampling",
          min: 0,
          max: Number.MAX_SAFE_INTEGER,
          defaultValue: node.inputs.seed as number,
        },
        {
          nodeId,
          paramPath: "inputs.steps",
          displayName: "Steps",
          displayNameKo: "스텝",
          description: "이미지 생성 반복 횟수예요. 높을수록 디테일이 좋아지지만 생성 시간이 늘어나요. (권장: 25-40)",
          type: "number",
          category: "sampling",
          min: 1,
          max: 100,
          step: 1,
          defaultValue: node.inputs.steps as number,
        },
        {
          nodeId,
          paramPath: "inputs.cfg",
          displayName: "CFG Scale",
          displayNameKo: "CFG 스케일",
          description: "입력 이미지를 얼마나 따를지 정해요. 낮으면 자유롭게, 높으면 원본에 가깝게 생성돼요. (권장: 3-7)",
          type: "number",
          category: "sampling",
          min: 1,
          max: 20,
          step: 0.5,
          defaultValue: node.inputs.cfg as number,
        },
        {
          nodeId,
          paramPath: "inputs.sampler_name",
          displayName: "Sampler",
          displayNameKo: "샘플러",
          description: "이미지 생성 알고리즘이에요. dpmpp_2m_sde가 품질과 속도의 균형이 좋아요.",
          type: "select",
          category: "sampling",
          options: SAMPLER_OPTIONS,
          defaultValue: node.inputs.sampler_name as string,
        }
      );
    }

    // IPAdapter
    if ((node.class_type === "IPAdapterAdvanced" || node.class_type === "IPAdapterStyleComposition") && node.inputs) {
      if ("weight_style" in node.inputs) {
        params.push({
          nodeId,
          paramPath: "inputs.weight_style",
          displayName: "Style Weight",
          displayNameKo: "스타일 가중치",
          description: "입력 이미지의 색감, 질감, 분위기를 얼마나 반영할지 정해요. 높을수록 원본 스타일에 가까워요.",
          type: "number",
          category: "ipadapter",
          min: 0,
          max: 2,
          step: 0.1,
          defaultValue: node.inputs.weight_style as number,
        });
      }
      if ("weight_composition" in node.inputs) {
        params.push({
          nodeId,
          paramPath: "inputs.weight_composition",
          displayName: "Composition Weight",
          displayNameKo: "구도 가중치",
          description: "입력 이미지의 구도와 배치를 얼마나 반영할지 정해요. 높을수록 원본 레이아웃을 유지해요.",
          type: "number",
          category: "ipadapter",
          min: 0,
          max: 2,
          step: 0.1,
          defaultValue: node.inputs.weight_composition as number,
        });
      }
      if ("weight" in node.inputs) {
        params.push({
          nodeId,
          paramPath: "inputs.weight",
          displayName: "IPAdapter Weight",
          displayNameKo: "IPAdapter 가중치",
          description: "입력 이미지의 전체적인 특징을 얼마나 반영할지 정해요. (권장: 0.5-1.0)",
          type: "number",
          category: "ipadapter",
          min: 0,
          max: 2,
          step: 0.1,
          defaultValue: node.inputs.weight as number,
        });
      }
    }

    // ControlNet (모두 추출, 나중에 인덱스 붙임)
    if (node.class_type === "ControlNetApplyAdvanced" && node.inputs) {
      params.push({
        nodeId,
        paramPath: "inputs.strength",
        displayName: "ControlNet Strength",
        displayNameKo: "ControlNet 강도",
        description: "입력 이미지의 형태/윤곽을 얼마나 유지할지 정해요. 높을수록 원본 모양을 더 따라요. (권장: 0.2-0.5)",
        type: "number",
        category: "controlnet",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: node.inputs.strength as number,
      });
    }

    // Preprocessor (모두 추출, 나중에 인덱스 붙임)
    if (node.class_type === "AIO_Preprocessor" && node.inputs) {
      params.push({
        nodeId,
        paramPath: "inputs.preprocessor",
        displayName: "Preprocessor",
        displayNameKo: "전처리기",
        description: "이미지 분석 방식이에요. Tile=질감 유지, Canny=윤곽선, Depth=입체감 기준",
        type: "select",
        category: "controlnet",
        options: PREPROCESSOR_OPTIONS,
        defaultValue: node.inputs.preprocessor as string,
      });
    }

    // CLIP Vision
    if (node.class_type === "PrepImageForClipVision" && node.inputs) {
      params.push({
        nodeId,
        paramPath: "inputs.sharpening",
        displayName: "Sharpening",
        displayNameKo: "샤프닝",
        description: "이미지의 선명도를 조절해요. 높을수록 디테일이 또렷해지지만 너무 높으면 부자연스러워요.",
        type: "number",
        category: "clip",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: node.inputs.sharpening as number,
      });
    }
  }

  // ControlNet과 Preprocessor에 인덱스 붙이기 (ControlNet은 최대 2개)
  const controlNetParams = params.filter(p => p.displayName.includes("ControlNet Strength")).slice(0, 2);
  const preprocessorParams = params.filter(p => p.displayName === "Preprocessor").slice(0, 2);

  // 초과된 ControlNet/Preprocessor 제거
  const otherParams = params.filter(p =>
    !p.displayName.includes("ControlNet Strength") && p.displayName !== "Preprocessor"
  );

  if (controlNetParams.length > 1) {
    controlNetParams.forEach((p, i) => {
      p.displayName = `ControlNet ${i + 1} Strength`;
      p.displayNameKo = `ControlNet ${i + 1} 강도`;
    });
  }

  if (preprocessorParams.length > 1) {
    preprocessorParams.forEach((p, i) => {
      p.displayName = `Preprocessor ${i + 1}`;
      p.displayNameKo = `전처리기 ${i + 1}`;
    });
  }

  return [...otherParams, ...controlNetParams, ...preprocessorParams];
}

async function main() {
  console.log("🌱 Seeding database...");

  const workflowsDir = path.join(process.cwd(), "workflows");
  const files = fs.readdirSync(workflowsDir).filter((f) => f.endsWith(".json"));

  // upscale.json과 backup 파일 제외
  const targetFiles = files.filter(
    (f) => !f.includes("upscale") && !f.includes("backup")
  );

  console.log(`📁 Found ${targetFiles.length} workflow files`);

  for (const file of targetFiles) {
    const name = path.basename(file, ".json");
    const filePath = path.join(workflowsDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const workflow = JSON.parse(content);

    const modelType = detectModelType(workflow);
    const editableParams = extractEditableParams(workflow);

    // 기존 데이터 확인 후 upsert
    const existing = await prisma.workflowTemplate.findFirst({
      where: { name },
    });

    if (existing) {
      // 기존 데이터 업데이트 (파라미터 설명 등 반영)
      await prisma.workflowTemplate.update({
        where: { id: existing.id },
        data: {
          modelType,
          baseWorkflow: workflow,
          editableParams: editableParams,
        },
      });
      console.log(`🔄 Updated template: ${name} (${modelType})`);
    } else {
      await prisma.workflowTemplate.create({
        data: {
          name,
          modelType,
          baseWorkflow: workflow,
          editableParams: editableParams,
        },
      });
      console.log(`✅ Created template: ${name} (${modelType})`);
    }
  }

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
