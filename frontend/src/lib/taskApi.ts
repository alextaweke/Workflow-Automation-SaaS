/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/api/taskApi.ts
import api from "./api";

export const taskApi = {
  getAll: (params?: any) => api.get("/tasks/", { params }),
  getById: (id: number) => api.get(`/tasks/${id}/`),
  create: (data: any) => api.post("/tasks/", data),
  update: (id: number, data: any) => api.patch(`/tasks/${id}/`, data),
  delete: (id: number) => api.delete(`/tasks/${id}/`),
  getMyTasks: () => api.get("/tasks/my_tasks/"),
  getTodo: () => api.get("/tasks/todo/"),
  getDashboard: () => api.get("/tasks/dashboard/"),
  bulkUpdate: (data: any) => api.post("/tasks/bulk_update/", data),
  addSubtask: (id: number, data: any) =>
    api.post(`/tasks/${id}/add_subtask/`, data),
  addCollaborator: (id: number, userId: number) =>
    api.post(`/tasks/${id}/add_collaborator/`, { user_id: userId }),
  removeCollaborator: (id: number, userId: number) =>
    api.post(`/tasks/${id}/remove_collaborator/`, { user_id: userId }),
  archive: (id: number) => api.post(`/tasks/${id}/archive/`),
  restore: (id: number) => api.post(`/tasks/${id}/restore/`),
};
