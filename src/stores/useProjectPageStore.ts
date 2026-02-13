import { create } from "zustand";
import type { ModelType, ParamConfig } from "@/types";

interface ProjectPageState {
  // Model selection
  modelType: ModelType;
  setModelType: (type: ModelType) => void;

  // Parameter values
  paramValues: Record<string, unknown>;
  setParamValues: (values: Record<string, unknown>) => void;
  updateParamValue: (key: string, value: unknown) => void;
  mergeParamValues: (values: Record<string, unknown>) => void;
  initParamsFromConfig: (params: ParamConfig[] | null) => void;

  // Input image
  inputImage: string | null;
  inputImagePreview: string | null;
  setInputImage: (base64: string, preview: string) => void;
  clearInputImage: () => void;

  // Generation tracking
  generating: boolean;
  currentHistoryId: string | null;
  startGenerating: (historyId: string) => void;
  stopGenerating: () => void;

  // History viewing
  viewingHistoryId: string | null;
  setViewingHistoryId: (id: string | null) => void;

  // Compare mode
  compareMode: boolean;
  compareLeftId: string | null;
  compareRightId: string | null;
  enterCompareMode: () => void;
  exitCompareMode: () => void;
  handleCompareSelect: (historyId: string) => void;

  // Template
  selectedTemplate: string;
  setSelectedTemplate: (name: string) => void;

  // History filter
  historyFilter: "all" | "sdxl" | "sd15";
  setHistoryFilter: (filter: "all" | "sdxl" | "sd15") => void;

  // Reset
  reset: () => void;
}

const initialState = {
  modelType: "sdxl" as ModelType,
  paramValues: {} as Record<string, unknown>,
  inputImage: null as string | null,
  inputImagePreview: null as string | null,
  generating: false,
  currentHistoryId: null as string | null,
  viewingHistoryId: null as string | null,
  compareMode: false,
  compareLeftId: null as string | null,
  compareRightId: null as string | null,
  selectedTemplate: "",
  historyFilter: "all" as "all" | "sdxl" | "sd15",
};

export const useProjectPageStore = create<ProjectPageState>((set) => ({
  ...initialState,

  setModelType: (type) => set({ modelType: type }),

  setParamValues: (values) => set({ paramValues: values }),
  updateParamValue: (key, value) =>
    set((state) => ({ paramValues: { ...state.paramValues, [key]: value } })),
  mergeParamValues: (values) =>
    set((state) => ({ paramValues: { ...state.paramValues, ...values } })),
  initParamsFromConfig: (params) => {
    if (!params) return;
    const values: Record<string, unknown> = {};
    params.forEach((p) => {
      values[`${p.nodeId}.${p.paramPath}`] = p.defaultValue;
    });
    set({ paramValues: values });
  },

  setInputImage: (base64, preview) =>
    set({ inputImage: base64, inputImagePreview: preview }),
  clearInputImage: () => set({ inputImage: null, inputImagePreview: null }),

  startGenerating: (historyId) =>
    set({ generating: true, currentHistoryId: historyId }),
  stopGenerating: () => set({ generating: false, currentHistoryId: null }),

  setViewingHistoryId: (id) => set({ viewingHistoryId: id }),

  enterCompareMode: () => set({ compareMode: true }),
  exitCompareMode: () =>
    set({ compareMode: false, compareLeftId: null, compareRightId: null }),
  handleCompareSelect: (historyId) =>
    set((state) => {
      if (!state.compareLeftId) {
        return { compareLeftId: historyId };
      }
      if (!state.compareRightId) {
        if (historyId === state.compareLeftId) return {};
        return { compareRightId: historyId };
      }
      return { compareLeftId: historyId, compareRightId: null };
    }),

  setSelectedTemplate: (name) => set({ selectedTemplate: name }),

  setHistoryFilter: (filter) => set({ historyFilter: filter }),

  reset: () => set(initialState),
}));
