/* eslint-disable @typescript-eslint/no-explicit-any */
// stores/workspaceStore.ts
import { create } from "zustand";
import { Workspace, WorkspaceStats } from "@/types";
// interface Workspace {
//   id: number;
//   uuid: string;
//   name: string;
//   description: string;
//   plan: string;
//   member_count: number;
//   total_tasks?: number;
//   completed_tasks?: number;
//   max_members?: number;
//   max_storage_mb?: number;
//   days_until_expiry?: number | null;
//   members?: any[];
//   created_at: string;
// }

// interface WorkspaceStats {
//   totalWorkspaces: number;
//   totalMembers: number;
//   completedTasks: number;
//   activePlan: string;
// }

interface WorkspaceStore {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  stats: WorkspaceStats;
  isLoading: boolean;
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
  fetchWorkspaces: () => Promise<void>;
  fetchWorkspaceById: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  createWorkspace: (data: any) => Promise<void>;
  updateWorkspace: (id: number, data: any) => Promise<void>;
  deleteWorkspace: (id: number) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  stats: {
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
  },
  isLoading: false,

  fetchWorkspaces: async () => {
    set({ isLoading: true });

    try {
      const { workspaceApi } = await import("@/lib/api");
      const response = await workspaceApi.getAll();

      const data = response.data;

      const workspaces = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
          ? data.results
          : Array.isArray(data.data)
            ? data.data
            : [];

      set({ workspaces });
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
      set({ workspaces: [] }); // IMPORTANT safety fallback
    } finally {
      set({ isLoading: false });
    }
  },

  fetchWorkspaceById: async (id: string) => {
    set({ isLoading: true });
    try {
      const { workspaceApi } = await import("@/lib/api");
      const response = await workspaceApi.getById(parseInt(id));
      set({ currentWorkspace: response.data });
    } catch (error) {
      console.error("Failed to fetch workspace:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStats: async (workspaceId?: number) => {
    try {
      const { workspaceApi } = await import("@/lib/api");

      if (!workspaceId) return;

      const response = await workspaceApi.getStats(workspaceId);
      set({ stats: response.data });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  },

  createWorkspace: async (data: any) => {
    try {
      const { workspaceApi } = await import("@/lib/api");
      const response = await workspaceApi.create(data);
      set((state) => ({ workspaces: [response.data, ...state.workspaces] }));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateWorkspace: async (id: number, data: any) => {
    try {
      const { workspaceApi } = await import("@/lib/api");
      const response = await workspaceApi.update(id, data);
      set((state) => ({
        workspaces: state.workspaces.map((w) =>
          w.id === id ? response.data : w,
        ),
        currentWorkspace: response.data,
      }));
    } catch (error) {
      throw error;
    }
  },

  deleteWorkspace: async (id: number) => {
    try {
      const { workspaceApi } = await import("@/lib/api");
      await workspaceApi.delete(id);
      set((state) => ({
        workspaces: state.workspaces.filter((w) => w.id !== id),
      }));
    } catch (error) {
      throw error;
    }
  },
  // Add these methods to your workspaceStore.ts
  // Add these to the existing WorkspaceStore interface and implementation

  // Add to interface:
  // updateMemberRole: (workspaceId: number, userId: number, role: string) => Promise<void>;
  // removeMember: (workspaceId: number, userId: number) => Promise<void>;
  // inviteMember: (workspaceId: number, email: string, role: string) => Promise<void>;

  // // Add to the store implementation:
  // updateMemberRole: async (workspaceId: number, userId: number, role: string) => {
  //   try {
  //     const { workspaceApi } = await import('@/lib/api');
  //     await workspaceApi.updateMemberRole(workspaceId, userId, role);
  //   } catch (error) {
  //     console.error('Failed to update member role:', error);
  //     throw error;
  //   }
  // },

  removeMember: async (workspaceId: number, userId: number) => {
    try {
      const { workspaceApi } = await import("@/lib/api");
      await workspaceApi.removeMember(workspaceId, userId);
    } catch (error) {
      console.error("Failed to remove member:", error);
      throw error;
    }
  },

  updateMemberRole: async (
    workspaceId: number,
    userId: number,
    role: string,
  ) => {
    try {
      const { workspaceApi } = await import("@/lib/api");
      await workspaceApi.updateMemberRole(workspaceId, userId, role);
    } catch (error) {
      console.error("Failed to update member role:", error);
      throw error;
    }
  },

  inviteMember: async (workspaceId: number, email: string, role: string) => {
    try {
      const { workspaceApi } = await import("@/lib/api");
      await workspaceApi.inviteMember(workspaceId, email, role);
    } catch (error) {
      console.error("Failed to invite member:", error);
      throw error;
    }
  },
}));
