import type {
  ComfyUIWorkflow,
  ParamConfig,
} from "@/types";

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
