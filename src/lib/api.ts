import type {
  Project,
  TestHistory,
  PaginatedResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  GenerateRequest,
  GenerateResponse,
} from "@/types";

// --- Base fetch helper ---

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }
  return res.json();
}

// --- Projects ---

export interface FetchProjectsParams {
  page?: number;
  pageSize?: number;
  sortBy?: "lastTestAt" | "historyCount";
  sortOrder?: "asc" | "desc";
  search?: string;
}

export function fetchProjects(params: FetchProjectsParams = {}) {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));
  if (params.sortBy) sp.set("sortBy", params.sortBy);
  if (params.sortOrder) sp.set("sortOrder", params.sortOrder);
  if (params.search) sp.set("search", params.search);
  return apiFetch<PaginatedResponse<Project>>(`/api/projects?${sp}`);
}

export function fetchProject(id: string) {
  return apiFetch<Project>(`/api/projects/${id}`);
}

export function createProject(data: CreateProjectRequest) {
  return apiFetch<Project>("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function updateProject(id: string, data: UpdateProjectRequest) {
  return apiFetch<Project>(`/api/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function deleteProject(id: string) {
  return apiFetch<{ success: boolean }>(`/api/projects/${id}`, {
    method: "DELETE",
  });
}

// --- Generate ---

export function generateImage(data: GenerateRequest) {
  return apiFetch<GenerateResponse>("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// --- History ---

export interface FetchHistoriesParams {
  projectId?: string;
  page?: number;
  pageSize?: number;
  status?: string;
  modelType?: string;
}

export function fetchHistories(params: FetchHistoriesParams = {}) {
  const sp = new URLSearchParams();
  if (params.projectId) sp.set("projectId", params.projectId);
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));
  if (params.status) sp.set("status", params.status);
  if (params.modelType) sp.set("modelType", params.modelType);
  return apiFetch<PaginatedResponse<TestHistory>>(`/api/history?${sp}`);
}

export function fetchHistory(id: string) {
  return apiFetch<TestHistory>(`/api/history/${id}`);
}

// --- Templates ---

export interface TemplateItem {
  name: string;
  displayName: string;
  modelType: string;
}

export function fetchTemplates(modelType: string) {
  return apiFetch<TemplateItem[]>(`/api/templates?modelType=${modelType}`);
}

export function fetchTemplateValues(
  name: string,
  projectId: string,
  modelType: string
) {
  return apiFetch<{ values: Record<string, unknown> }>(
    `/api/templates/${name}?projectId=${projectId}&modelType=${modelType}`
  );
}

// --- Auth ---

export function login(username: string, password: string) {
  return apiFetch<{ success: boolean; username: string }>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

export function logout() {
  return apiFetch<{ success: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}
