/* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// // stores/taskStore.ts
// import { create } from "zustand";
// import { Task } from "@/types";

// interface TaskStore {
//   tasks: Task[];
//   myTasks: Task[];
//   currentTask: Task | null;
//   statistics: any;
//   myTasksStats: any;
//   isLoading: boolean;
//   fetchTasks: (filters?: any) => Promise<void>;
//   fetchMyTasks: () => Promise<void>;
//   fetchTaskById: (id: number) => Promise<void>;
//   fetchDashboardStats: () => Promise<void>;
//   createTask: (data: any) => Promise<void>;
//   updateTask: (id: number, data: any) => Promise<void>;
//   deleteTask: (id: number) => Promise<void>;
//   bulkUpdate: (taskIds: number[], updates: any) => Promise<void>;
// }

// export const useTaskStore = create<TaskStore>((set, get) => ({
//   tasks: [],
//   myTasks: [],
//   currentTask: null,
//   statistics: null,
//   myTasksStats: null,
//   isLoading: false,

//   fetchTasks: async (filters = {}) => {
//     set({ isLoading: true });
//     try {
//       const { taskApi } = await import("@/lib/taskApi");
//       const response = await taskApi.getAll(filters);
//       set({ tasks: response.data.results || response.data });
//     } catch (error) {
//       console.error("Failed to fetch tasks:", error);
//     } finally {
//       set({ isLoading: false });
//     }
//   },

//   fetchMyTasks: async () => {
//     set({ isLoading: true });
//     try {
//       const { taskApi } = await import("@/lib/taskApi");
//       const response = await taskApi.getMyTasks();
//       set({
//         myTasks: response.data.tasks || [],
//         myTasksStats: response.data.statistics,
//       });
//     } catch (error) {
//       console.error("Failed to fetch my tasks:", error);
//     } finally {
//       set({ isLoading: false });
//     }
//   },

//   fetchTaskById: async (id: number) => {
//     set({ isLoading: true });
//     try {
//       const { taskApi } = await import("@/lib/taskApi");
//       const response = await taskApi.getById(id);
//       set({ currentTask: response.data });
//     } catch (error) {
//       console.error("Failed to fetch task:", error);
//     } finally {
//       set({ isLoading: false });
//     }
//   },

//   fetchDashboardStats: async () => {
//     try {
//       const { taskApi } = await import("@/lib/taskApi");
//       const response = await taskApi.getDashboard();
//       set({ statistics: response.data });
//     } catch (error) {
//       console.error("Failed to fetch dashboard stats:", error);
//     }
//   },

//   createTask: async (data: any) => {
//     try {
//       const { taskApi } = await import("@/lib/taskApi");
//       const response = await taskApi.create(data);
//       set((state) => ({ tasks: [response.data, ...state.tasks] }));
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   updateTask: async (id: number, data: any) => {
//     try {
//       const { taskApi } = await import("@/lib/taskApi");
//       const response = await taskApi.update(id, data);
//       set((state) => ({
//         tasks: state.tasks.map((t) => (t.id === id ? response.data : t)),
//         myTasks: state.myTasks.map((t) => (t.id === id ? response.data : t)),
//         currentTask: response.data,
//       }));
//     } catch (error) {
//       throw error;
//     }
//   },

//   deleteTask: async (id: number) => {
//     try {
//       const { taskApi } = await import("@/lib/taskApi");
//       await taskApi.delete(id);
//       set((state) => ({
//         tasks: state.tasks.filter((t) => t.id !== id),
//         myTasks: state.myTasks.filter((t) => t.id !== id),
//       }));
//     } catch (error) {
//       throw error;
//     }
//   },

//   bulkUpdate: async (taskIds: number[], updates: any) => {
//     try {
//       const { taskApi } = await import("@/lib/taskApi");
//       const response = await taskApi.bulkUpdate({ task_ids: taskIds, updates });
//       await get().fetchTasks();
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },
// }));
// stores/taskStore.ts
import { create } from "zustand";
import { Task, TaskStatistics, Filters } from "@/types";
import api from "@/lib/api";

interface TaskStore {
  tasks: Task[];
  myTasks: Task[];
  currentTask: Task | null;
  statistics: TaskStatistics | null;
  myTasksStats: any | null;
  isLoading: boolean;
  pagination: {
    count: number;
    next: string | null;
    previous: string | null;
    page: number;
    pages: number;
  } | null;

  fetchTasks: (params?: any) => Promise<void>;
  fetchTaskById: (id: number) => Promise<void>;
  fetchMyTasks: (params?: any) => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  createTask: (data: any) => Promise<void>;
  updateTask: (id: number, data: any) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  bulkUpdateTasks: (taskIds: number[], updates: any) => Promise<void>;
  assignTask: (id: number, userId: number) => Promise<void>;
  addCollaborator: (id: number, userId: number) => Promise<void>;
  removeCollaborator: (id: number, userId: number) => Promise<void>;
  addSubtask: (id: number, subtaskData: any) => Promise<void>;
  archiveTask: (id: number) => Promise<void>;
  restoreTask: (id: number) => Promise<void>;
  fetchTimeline: (workspaceId: number) => Promise<any[]>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  myTasks: [],
  currentTask: null,
  statistics: null,
  myTasksStats: null,
  isLoading: false,
  pagination: null,

  fetchTasks: async (params = {}) => {
    set({ isLoading: true });
    try {
      const response = await api.get("/tasks/", { params });
      set({
        tasks: response.data.results || response.data,
        pagination: response.data.results
          ? {
              count: response.data.count,
              next: response.data.next,
              previous: response.data.previous,
              page: params.page || 1,
              pages: Math.ceil(response.data.count / (params.page_size || 10)),
            }
          : null,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      set({ isLoading: false });
    }
  },

  fetchTaskById: async (id: number) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/tasks/${id}/`);
      set({ currentTask: response.data, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch task:", error);
      set({ isLoading: false });
    }
  },

  fetchMyTasks: async (params = {}) => {
    set({ isLoading: true });
    try {
      const response = await api.get("/tasks/my_tasks/", { params });
      set({
        myTasks: response.data.tasks || response.data,
        myTasksStats: response.data.statistics,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch my tasks:", error);
      set({ isLoading: false });
    }
  },

  fetchDashboardStats: async () => {
    try {
      const response = await api.get("/tasks/dashboard/");
      set({ statistics: response.data });
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    }
  },

  createTask: async (data: any) => {
    set({ isLoading: true });
    try {
      const response = await api.post("/tasks/", data);
      set((state) => ({
        tasks: [response.data, ...state.tasks],
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateTask: async (id: number, data: any) => {
    set({ isLoading: true });
    try {
      const response = await api.put(`/tasks/${id}/`, data);
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? response.data : task,
        ),
        myTasks: state.myTasks.map((task) =>
          task.id === id ? response.data : task,
        ),
        currentTask: response.data,
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteTask: async (id: number) => {
    set({ isLoading: true });
    try {
      await api.delete(`/tasks/${id}/`);
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
        myTasks: state.myTasks.filter((task) => task.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  bulkUpdateTasks: async (taskIds: number[], updates: any) => {
    set({ isLoading: true });
    try {
      const response = await api.post("/tasks/bulk_update/", {
        task_ids: taskIds,
        updates: updates,
      });
      // Refresh tasks after bulk update
      await get().fetchTasks();
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  assignTask: async (id: number, userId: number) => {
    try {
      const response = await api.post(`/tasks/${id}/assign_task/`, {
        user_id: userId,
      });
      await get().fetchTaskById(id);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addCollaborator: async (id: number, userId: number) => {
    try {
      const response = await api.post(`/tasks/${id}/add_collaborator/`, {
        user_id: userId,
      });
      await get().fetchTaskById(id);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  removeCollaborator: async (id: number, userId: number) => {
    try {
      const response = await api.post(`/tasks/${id}/remove_collaborator/`, {
        user_id: userId,
      });
      await get().fetchTaskById(id);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addSubtask: async (id: number, subtaskData: any) => {
    try {
      const response = await api.post(`/tasks/${id}/add_subtask/`, subtaskData);
      await get().fetchTaskById(id);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  archiveTask: async (id: number) => {
    try {
      const response = await api.post(`/tasks/${id}/archive/`);
      await get().fetchTasks();
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  restoreTask: async (id: number) => {
    try {
      const response = await api.post(`/tasks/${id}/restore/`);
      await get().fetchTasks();
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  fetchTimeline: async (workspaceId: number) => {
    try {
      const response = await api.get("/tasks/timeline/", {
        params: { workspace_id: workspaceId },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch timeline:", error);
      return [];
    }
  },
}));
