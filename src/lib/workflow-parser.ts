import type {
  ComfyUIWorkflow,
  ComfyUINode,
  ModelType,
  ParamConfig,
} from "@/types";

// 체크포인트 이름으로 모델 타입 감지
export function detectModelType(workflow: ComfyUIWorkflow): ModelType {
  for (const node of Object.values(workflow)) {
    if (node.class_type === "CheckpointLoaderSimple") {
      const ckptName = node.inputs.ckpt_name as string;
      if (ckptName?.toLowerCase().includes("xl")) {
        return "sdxl";
      }
      if (ckptName?.toLowerCase().includes("v1-5") || ckptName?.toLowerCase().includes("sd15")) {
        return "sd15";
      }
    }
  }
  // 해상도로 추정
  for (const node of Object.values(workflow)) {
    if (node.class_type === "EmptyLatentImage" || node.class_type === "ImageResize+") {
      const width = node.inputs.width as number;
      if (width >= 1024) return "sdxl";
      if (width <= 512) return "sd15";
    }
  }
  return "sdxl"; // 기본값
}

// KSampler 노드 찾기
export function findKSamplerNode(workflow: ComfyUIWorkflow): [string, ComfyUINode] | null {
  for (const [nodeId, node] of Object.entries(workflow)) {
    if (node.class_type === "KSampler") {
      return [nodeId, node];
    }
  }
  return null;
}

// IPAdapter 노드 찾기
export function findIPAdapterNode(workflow: ComfyUIWorkflow): [string, ComfyUINode] | null {
  for (const [nodeId, node] of Object.entries(workflow)) {
    if (
      node.class_type === "IPAdapterAdvanced" ||
      node.class_type === "IPAdapterStyleComposition"
    ) {
      return [nodeId, node];
    }
  }
  return null;
}

// ControlNet Apply 노드들 찾기
export function findControlNetNodes(workflow: ComfyUIWorkflow): [string, ComfyUINode][] {
  const nodes: [string, ComfyUINode][] = [];
  for (const [nodeId, node] of Object.entries(workflow)) {
    if (node.class_type === "ControlNetApplyAdvanced") {
      nodes.push([nodeId, node]);
    }
  }
  return nodes;
}

// PrepImageForClipVision 노드 찾기
export function findClipVisionPrepNode(workflow: ComfyUIWorkflow): [string, ComfyUINode] | null {
  for (const [nodeId, node] of Object.entries(workflow)) {
    if (node.class_type === "PrepImageForClipVision") {
      return [nodeId, node];
    }
  }
  return null;
}

// AIO_Preprocessor 노드들 찾기
export function findPreprocessorNodes(workflow: ComfyUIWorkflow): [string, ComfyUINode][] {
  const nodes: [string, ComfyUINode][] = [];
  for (const [nodeId, node] of Object.entries(workflow)) {
    if (node.class_type === "AIO_Preprocessor") {
      nodes.push([nodeId, node]);
    }
  }
  return nodes;
}

// Sampler 옵션 목록
export const SAMPLER_OPTIONS = [
  "euler",
  "euler_ancestral",
  "heun",
  "dpm_2",
  "dpm_2_ancestral",
  "lms",
  "dpm_fast",
  "dpm_adaptive",
  "dpmpp_2s_ancestral",
  "dpmpp_sde",
  "dpmpp_sde_gpu",
  "dpmpp_2m",
  "dpmpp_2m_sde",
  "dpmpp_2m_sde_gpu",
  "dpmpp_3m_sde",
  "dpmpp_3m_sde_gpu",
  "ddim",
  "uni_pc",
  "uni_pc_bh2",
];

// Preprocessor 옵션 목록
export const PREPROCESSOR_OPTIONS = [
  "TilePreprocessor",
  "CannyEdgePreprocessor",
  "DepthAnythingV2Preprocessor",
  "TTPlanet_TileGF_Preprocessor",
  "LineartStandardPreprocessor",
  "AnimeLineArtPreprocessor",
];

// 워크플로우에서 조절 가능한 파라미터 추출
export function extractEditableParams(workflow: ComfyUIWorkflow): ParamConfig[] {
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

  // ControlNet 파라미터 (최대 2개)
  const controlnetNodes = findControlNetNodes(workflow).slice(0, 2);
  controlnetNodes.forEach(([nodeId, node], index) => {
    const suffix = controlnetNodes.length > 1 ? ` ${index + 1}` : "";
    params.push({
      nodeId,
      paramPath: "inputs.strength",
      displayName: `ControlNet${suffix} Strength`,
      displayNameKo: `ControlNet${suffix} 강도`,
      description: `입력 이미지의 형태/윤곽을 얼마나 유지할지 정해요. 높을수록 원본 모양을 더 따라요. (권장: 0.2-0.5)`,
      type: "number",
      category: "controlnet",
      min: 0,
      max: 1,
      step: 0.05,
      defaultValue: node.inputs.strength as number,
    });
  });

  // Preprocessor 파라미터 (최대 2개)
  const preprocessorNodes = findPreprocessorNodes(workflow).slice(0, 2);
  preprocessorNodes.forEach(([nodeId, node], index) => {
    const suffix = preprocessorNodes.length > 1 ? ` ${index + 1}` : "";
    params.push({
      nodeId,
      paramPath: "inputs.preprocessor",
      displayName: `Preprocessor${suffix}`,
      displayNameKo: `전처리기${suffix}`,
      description: "이미지 분석 방식이에요. Tile=질감 유지, Canny=윤곽선, Depth=입체감 기준",
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
      description: "이미지의 선명도를 조절해요. 높을수록 디테일이 또렷해지지만 너무 높으면 부자연스러워요.",
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

// 파라미터를 워크플로우에 적용
export function applyParamsToWorkflow(
  workflow: ComfyUIWorkflow,
  editableParams: ParamConfig[],
  values: Record<string, unknown>
): ComfyUIWorkflow {
  const result = JSON.parse(JSON.stringify(workflow)) as ComfyUIWorkflow;

  for (const param of editableParams) {
    const paramKey = `${param.nodeId}.${param.paramPath}`;
    if (paramKey in values) {
      const value = values[paramKey];
      const pathParts = param.paramPath.split(".");

      let target: Record<string, unknown> = result[param.nodeId] as unknown as Record<string, unknown>;
      for (let i = 0; i < pathParts.length - 1; i++) {
        target = target[pathParts[i]] as Record<string, unknown>;
      }
      target[pathParts[pathParts.length - 1]] = value;
    }
  }

  return result;
}

// Base64 이미지를 워크플로우에 주입
export function injectBase64Image(
  workflow: ComfyUIWorkflow,
  base64Data: string
): ComfyUIWorkflow {
  const result = JSON.parse(JSON.stringify(workflow)) as ComfyUIWorkflow;

  // load_image 노드 찾기
  if (result["load_image"]) {
    (result["load_image"].inputs as Record<string, unknown>).base64_data = base64Data;
  }

  return result;
}

// 파라미터를 카테고리별로 그룹화
export function groupParamsByCategory(params: ParamConfig[]): Record<string, ParamConfig[]> {
  const groups: Record<string, ParamConfig[]> = {
    sampling: [],
    ipadapter: [],
    controlnet: [],
    clip: [],
    other: [],
  };

  for (const param of params) {
    if (groups[param.category]) {
      groups[param.category].push(param);
    } else {
      groups.other.push(param);
    }
  }

  return groups;
}

// 카테고리 표시 이름
export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  sampling: "Sampling",
  ipadapter: "IPAdapter",
  controlnet: "ControlNet",
  clip: "CLIP Vision",
  other: "기타",
};
