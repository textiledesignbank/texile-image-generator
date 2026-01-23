// 모델 타입
export type ModelType = "sd15" | "sdxl";

// 파라미터 타입
export type ParamType = "number" | "select" | "text";

// 조절 가능한 파라미터 설정
export interface ParamConfig {
  nodeId: string;
  paramPath: string;
  displayName: string;
  displayNameKo: string;
  description: string; // 파라미터 설명 (디자이너용)
  type: ParamType;
  category: "sampling" | "ipadapter" | "controlnet" | "clip" | "other";
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  defaultValue: number | string;
}

// 워크플로우 템플릿
export interface WorkflowTemplate {
  id: string;
  name: string;
  modelType: ModelType;
  baseWorkflow: ComfyUIWorkflow;
  editableParams: ParamConfig[];
  createdAt: Date;
  updatedAt: Date;
}

// ComfyUI 워크플로우 노드
export interface ComfyUINode {
  inputs: Record<string, unknown>;
  class_type: string;
  _meta?: {
    title: string;
  };
}

// ComfyUI 워크플로우
export type ComfyUIWorkflow = Record<string, ComfyUINode>;

// 테스트 히스토리
export interface TestHistory {
  id: string;
  workflowId: string | null;
  params: Record<string, unknown>;
  inputImageUrl: string | null;
  outputImageUrls: string[] | null;
  status: JobStatus;
  jobId: string | null;
  errorMessage: string | null;
  executedAt: Date;
  completedAt: Date | null;
  workflow?: WorkflowTemplate | null;
}

// 작업 상태
export type JobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

// SQS 메시지 포맷
export interface SQSJobMessage {
  jobId: string;
  historyId: string;
  workflow: ComfyUIWorkflow;
  inputImageS3Key?: string;
  params: Record<string, unknown>;
}

// API 요청/응답 타입
export interface CreateWorkflowRequest {
  name: string;
  modelType: ModelType;
  baseWorkflow: ComfyUIWorkflow;
  editableParams: ParamConfig[];
  sourceTemplateId?: string; // 복제 시 원본 ID
}

export interface UpdateWorkflowRequest {
  name?: string;
  baseWorkflow?: ComfyUIWorkflow;
  editableParams?: ParamConfig[];
}

export interface GenerateRequest {
  workflowId: string;
  params: Record<string, unknown>;
  inputImageBase64?: string;
}

export interface GenerateResponse {
  historyId: string;
  jobId: string;
  status: JobStatus;
}

// 리스트 응답
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 파라미터 카테고리별 그룹
export interface ParamGroup {
  category: ParamConfig["category"];
  displayName: string;
  params: ParamConfig[];
}

// 워크플로우 + 히스토리 카운트
export interface WorkflowWithCount extends WorkflowTemplate {
  _count?: {
    histories: number;
  };
}
