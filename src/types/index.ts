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
  description: string;
  type: ParamType;
  category: "sampling" | "ipadapter" | "controlnet" | "clip" | "other";
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  defaultValue: number | string;
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

// ==================== 새로운 Project 기반 구조 ====================

// 프로젝트
export interface Project {
  id: string;
  name: string;

  // SDXL 모델 설정
  sdxlWorkflow: ComfyUIWorkflow | null;
  sdxlParams: ParamConfig[] | null;

  // SD1.5 모델 설정
  sd15Workflow: ComfyUIWorkflow | null;
  sd15Params: ParamConfig[] | null;

  createdAt: Date;
  updatedAt: Date;

  // 관계
  histories?: TestHistory[];
  _count?: {
    histories: number;
  };
}

// 테스트 히스토리
export interface TestHistory {
  id: string;
  projectId: string;
  modelType: ModelType;
  params: Record<string, unknown>;
  inputImageUrl: string | null;
  outputImageUrls: string[] | null;
  inputThumbnailUrl?: string | null;
  outputThumbnailUrls?: string[] | null;
  status: JobStatus;
  jobId: string | null;
  errorMessage: string | null;
  isSelected: boolean;
  executedAt: Date;
  completedAt: Date | null;

  // 관계
  project?: Project | null;
}

// 작업 상태
export type JobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

// ==================== API 요청/응답 타입 ====================

// 프로젝트 생성 요청
export interface CreateProjectRequest {
  name: string;
  sdxlWorkflow?: ComfyUIWorkflow;
  sdxlParams?: ParamConfig[];
  sd15Workflow?: ComfyUIWorkflow;
  sd15Params?: ParamConfig[];
}

// 프로젝트 수정 요청
export interface UpdateProjectRequest {
  name?: string;
  sdxlWorkflow?: ComfyUIWorkflow;
  sdxlParams?: ParamConfig[];
  sd15Workflow?: ComfyUIWorkflow;
  sd15Params?: ParamConfig[];
}

// 이미지 생성 요청
export interface GenerateRequest {
  projectId: string;
  modelType: ModelType;
  params: Record<string, unknown>;
  inputImageS3Key?: string;
}

// 이미지 생성 응답
export interface GenerateResponse {
  historyId: string;
  jobId: string;
  status: JobStatus;
}

// SQS 메시지 포맷
export interface SQSJobMessage {
  jobId: string;
  historyId: string;
  workflow: ComfyUIWorkflow;
  inputImageS3Key?: string;
  params: Record<string, unknown>;
}

// 리스트 응답
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

