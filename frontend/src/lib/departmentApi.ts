import api from "./api";
export const departmentApi = {
  getById: (id: number) => api.get(`/departments/${id}/`),

  getMembers: (id: number) => api.get(`/departments/${id}/members/`),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: (id: number, data: any) => api.patch(`/departments/${id}/`, data),
  delete: (id: number) => api.delete(`/departments/${id}/`),
  addMember: (id: number, userId: number) =>
    api.post(`/departments/${id}/add_member/`, { user_id: userId }),
  removeMember: (id: number, userId: number) =>
    api.delete(`/departments/${id}/remove_member/?user_id=${userId}`),
};
