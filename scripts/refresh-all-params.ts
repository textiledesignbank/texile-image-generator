import { PrismaClient } from "@prisma/client";

// workflow-parser의 로직을 인라인으로 복사 (import 문제 회피)
interface ComfyUINode {
  inputs: Record<string, unknown>;
  class_type: string;
}

type ComfyUIWorkflow = Record<string, ComfyUINode>;

interface ParamConfig {
  nodeId: string;
  paramPath: string;
  displayName: string;
  displayNameKo: string;
  description: string;
  type: "number" | "select" | "text";
  category: "sampling" | "ipadapter" | "controlnet" | "clip" | "other";
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  defaultValue: number | string;
}

const SAMPLER_OPTIONS = [
  "euler", "euler_ancestral", "heun", "dpm_2", "dpm_2_ancestral",
  "lms", "dpm_fast", "dpm_adaptive", "dpmpp_2s_ancestral", "dpmpp_sde",
  "dpmpp_sde_gpu", "dpmpp_2m", "dpmpp_2m_sde", "dpmpp_2m_sde_gpu",
  "dpmpp_3m_sde", "dpmpp_3m_sde_gpu", "ddim", "uni_pc", "uni_pc_bh2",
];

const PREPROCESSOR_OPTIONS = [
  "TilePreprocessor", "CannyEdgePreprocessor", "DepthAnythingV2Preprocessor",
  "TTPlanet_TileGF_Preprocessor", "LineartStandardPreprocessor", "AnimeLineArtPreprocessor",
];

function findKSamplerNode(workflow: ComfyUIWorkflow): [string, ComfyUINode] | null {
  for (const [nodeId, node] of Object.entries(workflow)) {
    if (node.class_type === "KSampler") {
      return [nodeId, node];
    }
  }
  return null;
}

function findIPAdapterNode(workflow: ComfyUIWorkflow): [string, ComfyUINode] | null {
  for (const [nodeId, node] of Object.entries(workflow)) {
    if (node.class_type === "IPAdapterAdvanced" || node.class_type === "IPAdapterStyleComposition") {
      return [nodeId, node];
    }
  }
  return null;
}

function findControlNetNodes(workflow: ComfyUIWorkflow): [string, ComfyUINode][] {
  const nodes: [string, ComfyUINode][] = [];
  for (const [nodeId, node] of Object.entries(workflow)) {
    if (node.class_type === "ControlNetApplyAdvanced") {
      nodes.push([nodeId, node]);
    }
  }
  return nodes;
}

function findPreprocessorNodes(workflow: ComfyUIWorkflow): [string, ComfyUINode][] {
  const nodes: [string, ComfyUINode][] = [];
  for (const [nodeId, node] of Object.entries(workflow)) {
    if (node.class_type === "AIO_Preprocessor") {
      nodes.push([nodeId, node]);
    }
  }
  return nodes;
}

function findClipVisionPrepNode(workflow: ComfyUIWorkflow): [string, ComfyUINode] | null {
  for (const [nodeId, node] of Object.entries(workflow)) {
    if (node.class_type === "PrepImageForClipVision") {
      return [nodeId, node];
    }
  }
  return null;
}

function extractEditableParams(workflow: ComfyUIWorkflow): ParamConfig[] {
  const params: ParamConfig[] = [];

  // KSampler 파라미터
  const ksampler = findKSamplerNode(workflow);
  if (ksampler) {
    const [nodeId, node] = ksampler;
    params.push(
      {
        nodeId,
        paramPath: "inputs.seed",
        displayName: "Seed",
        displayNameKo: "시드",
        description: "같은 숫자를 입력하면 동일한 결과를 재현할 수 있어요.",
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
        description: "이미지 생성 반복 횟수예요. (권장: 25-40)",
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
        description: "입력 이미지를 얼마나 따를지 정해요. (권장: 3-7)",
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
        description: "이미지 생성 알고리즘이에요.",
        type: "select",
        category: "sampling",
        options: SAMPLER_OPTIONS,
        defaultValue: node.inputs.sampler_name as string,
      }
    );

    // denoise 파라미터 (있는 경우에만 추가)
    if ("denoise" in node.inputs) {
      params.push({
        nodeId,
        paramPath: "inputs.denoise",
        displayName: "Denoise",
        displayNameKo: "디노이즈",
        description: "원본 이미지 변형 정도. 낮으면 원본 유지, 높으면 많이 변형해요. (권장: 0.5-0.8)",
        type: "number",
        category: "sampling",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: (node.inputs.denoise as number) ?? 1.0,
      });
    }
  }

  // IPAdapter 파라미터
  const ipadapter = findIPAdapterNode(workflow);
  if (ipadapter) {
    const [nodeId, node] = ipadapter;
    if ("weight_style" in node.inputs) {
      params.push({
        nodeId,
        paramPath: "inputs.weight_style",
        displayName: "Style Weight",
        displayNameKo: "스타일 가중치",
        description: "입력 이미지의 색감, 질감, 분위기를 얼마나 반영할지 정해요.",
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
        description: "입력 이미지의 구도와 배치를 얼마나 반영할지 정해요.",
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
        description: "입력 이미지의 전체적인 특징을 얼마나 반영할지 정해요.",
        type: "number",
        category: "ipadapter",
        min: 0,
        max: 2,
        step: 0.1,
        defaultValue: node.inputs.weight as number,
      });
    }
  }

  // ControlNet 파라미터
  const controlnetNodes = findControlNetNodes(workflow).slice(0, 2);
  controlnetNodes.forEach(([nodeId, node], index) => {
    const suffix = controlnetNodes.length > 1 ? ` ${index + 1}` : "";
    params.push({
      nodeId,
      paramPath: "inputs.strength",
      displayName: `ControlNet${suffix} Strength`,
      displayNameKo: `ControlNet${suffix} 강도`,
      description: "입력 이미지의 형태/윤곽을 얼마나 유지할지 정해요.",
      type: "number",
      category: "controlnet",
      min: 0,
      max: 1,
      step: 0.05,
      defaultValue: node.inputs.strength as number,
    });
  });

  // Preprocessor 파라미터
  const preprocessorNodes = findPreprocessorNodes(workflow).slice(0, 2);
  preprocessorNodes.forEach(([nodeId, node], index) => {
    const suffix = preprocessorNodes.length > 1 ? ` ${index + 1}` : "";
    params.push({
      nodeId,
      paramPath: "inputs.preprocessor",
      displayName: `Preprocessor${suffix}`,
      displayNameKo: `전처리기${suffix}`,
      description: "이미지 분석 방식이에요.",
      type: "select",
      category: "controlnet",
      options: PREPROCESSOR_OPTIONS,
      defaultValue: node.inputs.preprocessor as string,
    });
  });

  // CLIP Vision 파라미터
  const clipVision = findClipVisionPrepNode(workflow);
  if (clipVision) {
    const [nodeId, node] = clipVision;
    params.push({
      nodeId,
      paramPath: "inputs.sharpening",
      displayName: "Sharpening",
      displayNameKo: "샤프닝",
      description: "이미지의 선명도를 조절해요.",
      type: "number",
      category: "clip",
      min: 0,
      max: 1,
      step: 0.05,
      defaultValue: node.inputs.sharpening as number,
    });
  }

  return params;
}

// 메인 실행
const prisma = new PrismaClient();

async function main() {
  const workflows = await prisma.workflowTemplate.findMany();
  console.log(`Found ${workflows.length} workflows`);

  for (const workflow of workflows) {
    const baseWorkflow = workflow.baseWorkflow as unknown as ComfyUIWorkflow;
    const newParams = extractEditableParams(baseWorkflow);

    await prisma.workflowTemplate.update({
      where: { id: workflow.id },
      data: { editableParams: newParams as object },
    });

    const paramNames = newParams.map((p) => p.displayNameKo).join(", ");
    console.log(`✓ ${workflow.name}: ${newParams.length} params (${paramNames})`);
  }

  console.log("\nDone!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
