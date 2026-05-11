/* eslint-disable @typescript-eslint/no-explicit-any */
// stores/workspaceStore.ts
import { create } from "zustand";
import { Workspace, WorkspaceStats, Member } from "@/types";
import api from "@/lib/api";

interface WorkspaceStore {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  stats: WorkspaceStats;
  globalStats: WorkspaceStats;
  isLoading: boolean;
  error: string | null;

  // Workspace methods
  fetchWorkspaces: () => Promise<void>;
  fetchWorkspaceById: (id: number) => Promise<void>;
  createWorkspace: (data: any) => Promise<any>;
  updateWorkspace: (id: number, data: any) => Promise<void>;
  deleteWorkspace: (id: number) => Promise<void>;

  // Stats methods
  fetchGlobalStats: () => Promise<void>;
  fetchStats: (workspaceId?: number) => Promise<void>;

  // Member methods
  fetchWorkspaceMembers: (workspaceId: number) => Promise<Member[]>;
  inviteMember: (
    workspaceId: number,
    email: string,
    role: string,
  ) => Promise<void>;
  updateMemberRole: (
    workspaceId: number,
    userId: number,
    role: string,
  ) => Promise<void>;
  removeMember: (workspaceId: number, userId: number) => Promise<void>;

  // Utility
  clearError: () => void;
}

const initialStats: WorkspaceStats = {
  totalWorkspaces: 0,
  totalMembers: 0,
  completedTasks: 0,
  activePlan: "free",
  total_members: 0,
  total_tasks: 0,
  completed_tasks: 0,
  overdue_tasks: 0,
  tasks_by_status: [],
  tasks_by_priority: [],
  subscription: {
    plan: "",
    is_active: false,
    days_until_expiry: undefined,
    limits: {
      max_members: 0,
      max_projects: 0,
      max_storage_mb: 0,
    },
  },
};

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  stats: initialStats,
  globalStats: initialStats,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchGlobalStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/workspaces/my_stats/");
      set({
        globalStats: {
          ...initialStats,
          totalWorkspaces: response.data.total_workspaces || 0,
          totalMembers: response.data.total_members || 0,
          completedTasks: response.data.completed_tasks || 0,
          activePlan: response.data.active_plan || "free",
          total_members: response.data.total_members || 0,
          total_tasks: response.data.total_tasks || 0,
          completed_tasks: response.data.completed_tasks || 0,
        },
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Failed to fetch global stats:", error);
      set({
        isLoading: false,
        error: error.response?.data?.message || "Failed to fetch global stats",
      });
    }
  },

  fetchWorkspaceMembers: async (workspaceId: number) => {
    try {
      const { workspaceApi } = await import("@/lib/workspaceApi");
      const response = await workspaceApi.getMembers(workspaceId);
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch members:", error);
      return [];
    }
  },

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const { workspaceApi } = await import("@/lib/workspaceApi");
      const response = await workspaceApi.getAll();
      const data = response.data;

      let workspaces: Workspace[] = [];
      if (Array.isArray(data)) {
        workspaces = data;
      } else if (Array.isArray(data?.results)) {
        workspaces = data.results;
      } else if (Array.isArray(data?.data)) {
        workspaces = data.data;
      }

      set({ workspaces, isLoading: false, error: null });
    } catch (error: any) {
      console.error("Failed to fetch workspaces:", error);
      set({
        workspaces: [],
        isLoading: false,
        error: error.response?.data?.message || "Failed to fetch workspaces",
      });
    }
  },

  fetchWorkspaceById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const { workspaceApi } = await import("@/lib/workspaceApi");
      const response = await workspaceApi.getById(id);
      set({ currentWorkspace: response.data, isLoading: false, error: null });
    } catch (error: any) {
      console.error("Failed to fetch workspace:", error);
      set({
        isLoading: false,
        error: error.response?.data?.message || "Failed to fetch workspace",
      });
    }
  },

  fetchStats: async (workspaceId?: number) => {
    if (!workspaceId) {
      console.warn("No workspaceId provided to fetchStats");
      return;
    }

    try {
      const { workspaceApi } = await import("@/lib/workspaceApi");
      const response = await workspaceApi.getStats(workspaceId);
      set({ stats: response.data });
    } catch (error: any) {
      console.error("Failed to fetch stats:", error);
      set({
        error:
          error.response?.data?.message || "Failed to fetch workspace stats",
      });
    }
  },

  createWorkspace: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const { workspaceApi } = await import("@/lib/workspaceApi");
      const response = await workspaceApi.create(data);
      set((state) => ({
        workspaces: [response.data, ...state.workspaces],
        isLoading: false,
        error: null,
      }));
      return response.data;
    } catch (error: any) {
      console.error("Failed to create workspace:", error);
      set({
        isLoading: false,
        error: error.response?.data?.message || "Failed to create workspace",
      });
      throw error;
    }
  },

  updateWorkspace: async (id: number, data: any) => {
    set({ isLoading: true, error: null });
    try {
      const { workspaceApi } = await import("@/lib/workspaceApi");
      const response = await workspaceApi.update(id, data);
      set((state) => ({
        workspaces: state.workspaces.map((w) =>
          w.id === id ? response.data : w,
        ),
        currentWorkspace: response.data,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      console.error("Failed to update workspace:", error);
      set({
        isLoading: false,
        error: error.response?.data?.message || "Failed to update workspace",
      });
      throw error;
    }
  },

  deleteWorkspace: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const { workspaceApi } = await import("@/lib/workspaceApi");
      await workspaceApi.delete(id);
      set((state) => ({
        workspaces: state.workspaces.filter((w) => w.id !== id),
        currentWorkspace:
          state.currentWorkspace?.id === id ? null : state.currentWorkspace,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      console.error("Failed to delete workspace:", error);
      set({
        isLoading: false,
        error: error.response?.data?.message || "Failed to delete workspace",
      });
      throw error;
    }
  },

  removeMember: async (workspaceId: number, userId: number) => {
    set({ isLoading: true, error: null });
    try {
      const { workspaceApi } = await import("@/lib/workspaceApi");
      await workspaceApi.removeMember(workspaceId, userId);
      set({ isLoading: false, error: null });
    } catch (error: any) {
      console.error("Failed to remove member:", error);
      set({
        isLoading: false,
        error: error.response?.data?.message || "Failed to remove member",
      });
      throw error;
    }
  },

  updateMemberRole: async (
    workspaceId: number,
    userId: number,
    role: string,
  ) => {
    set({ isLoading: true, error: null });
    try {
      const { workspaceApi } = await import("@/lib/workspaceApi");
      await workspaceApi.updateMemberRole(workspaceId, userId, role);
      set({ isLoading: false, error: null });
    } catch (error: any) {
      console.error("Failed to update member role:", error);
      set({
        isLoading: false,
        error: error.response?.data?.message || "Failed to update member role",
      });
      throw error;
    }
  },

  inviteMember: async (workspaceId: number, email: string, role: string) => {
    set({ isLoading: true, error: null });
    try {
      const { workspaceApi } = await import("@/lib/workspaceApi");
      await workspaceApi.inviteMember(workspaceId, email, role);
      set({ isLoading: false, error: null });
    } catch (error: any) {
      console.error("Failed to invite member:", error);
      set({
        isLoading: false,
        error: error.response?.data?.message || "Failed to invite member",
      });
      throw error;
    }
  },
}));
