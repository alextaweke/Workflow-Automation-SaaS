/* eslint-disable @typescript-eslint/no-explicit-any */
// stores/taskStore.ts
import { create } from "zustand";
import { Task } from "@/types";

interface TaskStore {
  tasks: Task[];
  myTasks: Task[];
  currentTask: Task | null;
  statistics: any;
  myTasksStats: any;
  isLoading: boolean;
  fetchTasks: (filters?: any) => Promise<void>;
  fetchMyTasks: () => Promise<void>;
  fetchTaskById: (id: number) => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  createTask: (data: any) => Promise<void>;
  updateTask: (id: number, data: any) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  bulkUpdate: (taskIds: number[], updates: any) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  myTasks: [],
  currentTask: null,
  statistics: null,
  myTasksStats: null,
  isLoading: false,

  fetchTasks: async (filters = {}) => {
    set({ isLoading: true });
    try {
      const { taskApi } = await import("@/lib/taskApi");
      const response = await taskApi.getAll(filters);
      set({ tasks: response.data.results || response.data });
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyTasks: async () => {
    set({ isLoading: true });
    try {
      const { taskApi } = await import("@/lib/taskApi");
      const response = await taskApi.getMyTasks();
      set({
        myTasks: response.data.tasks || [],
        myTasksStats: response.data.statistics,
      });
    } catch (error) {
      console.error("Failed to fetch my tasks:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTaskById: async (id: number) => {
    set({ isLoading: true });
    try {
      const { taskApi } = await import("@/lib/taskApi");
      const response = await taskApi.getById(id);
      set({ currentTask: response.data });
    } catch (error) {
      console.error("Failed to fetch task:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDashboardStats: async () => {
    try {
      const { taskApi } = await import("@/lib/taskApi");
      const response = await taskApi.getDashboard();
      set({ statistics: response.data });
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    }
  },

  createTask: async (data: any) => {
    try {
      const { taskApi } = await import("@/lib/taskApi");
      const response = await taskApi.create(data);
      set((state) => ({ tasks: [response.data, ...state.tasks] }));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateTask: async (id: number, data: any) => {
    try {
      const { taskApi } = await import("@/lib/taskApi");
      const response = await taskApi.update(id, data);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? response.data : t)),
        myTasks: state.myTasks.map((t) => (t.id === id ? response.data : t)),
        currentTask: response.data,
      }));
    } catch (error) {
      throw error;
    }
  },

  deleteTask: async (id: number) => {
    try {
      const { taskApi } = await import("@/lib/taskApi");
      await taskApi.delete(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        myTasks: state.myTasks.filter((t) => t.id !== id),
      }));
    } catch (error) {
      throw error;
    }
  },

  bulkUpdate: async (taskIds: number[], updates: any) => {
    try {
      const { taskApi } = await import("@/lib/taskApi");
      const response = await taskApi.bulkUpdate({ task_ids: taskIds, updates });
      await get().fetchTasks();
      return response.data;
    } catch (error) {
      throw error;
    }
  },
}));
