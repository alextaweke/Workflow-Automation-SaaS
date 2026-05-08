/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "./api";

export const workspaceApi = {
  getAll: () => api.get("/workspaces/"),

  getById: (id: number) => api.get(`/workspaces/${id}/`),

  create: (data: unknown) => api.post("/workspaces/", data),

  update: (id: number, data: any) => api.put(`/workspaces/${id}/`, data),

  delete: (id: number) => api.delete(`/workspaces/${id}/`),

  getStats: (id: number) => api.get(`/workspaces/${id}/stats/`),

  addMember: (id: number, userId: number, role: string) =>
    api.post(`/workspaces/${id}/add_member/`, {
      user_id: userId,
      role,
    }),

  removeMember: (id: number, userId: number) =>
    api.delete(`/workspaces/${id}/remove_member/?user_id=${userId}`),

  inviteMember: (id: number, email: string, role: string) =>
    api.post(`/workspaces/${id}/invite_member/`, {
      email,
      role,
    }),

  getMembers: (id: number) => api.get(`/workspaces/${id}/members/`),

  updateMemberRole: (id: number, userId: number, role: string) =>
    api.patch(`/workspaces/${id}/update_member_role/`, {
      user_id: userId,
      role,
    }),
};
