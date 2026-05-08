/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "./api";

export const companyApi = {
  getAll: () => api.get("/companies/"),
  getById: (id: number) => api.get(`/companies/${id}/`),
  create: (data: any) => api.post("/companies/", data),
  update: (id: number, data: any) => api.put(`/companies/${id}/`, data),
  delete: (id: number) => api.delete(`/companies/${id}/`),
  getDepartments: (id: number) => api.get(`/companies/${id}/departments/`),
  addDepartment: (id: number, data: any) =>
    api.post(`/companies/${id}/add_department/`, data),
  getStats: (id: number) => api.get(`/companies/${id}/stats/`),
};
