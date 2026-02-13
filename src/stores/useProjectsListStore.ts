import { create } from "zustand";

type SortBy = "lastTestAt" | "historyCount";
type SortOrder = "asc" | "desc";

interface ProjectsListState {
  page: number;
  sortBy: SortBy;
  sortOrder: SortOrder;
  search: string;
  searchInput: string;

  setPage: (page: number) => void;
  toggleSort: (column: SortBy) => void;
  setSearch: (search: string) => void;
  setSearchInput: (input: string) => void;
}

export const useProjectsListStore = create<ProjectsListState>((set) => ({
  page: 1,
  sortBy: "lastTestAt",
  sortOrder: "desc",
  search: "",
  searchInput: "",

  setPage: (page) => set({ page }),

  toggleSort: (column) =>
    set((state) => {
      if (state.sortBy === column) {
        return {
          sortOrder: state.sortOrder === "desc" ? "asc" : "desc",
          page: 1,
        };
      }
      return { sortBy: column, sortOrder: "desc", page: 1 };
    }),

  setSearch: (search) => set({ search, page: 1 }),
  setSearchInput: (searchInput) => set({ searchInput }),
}));
