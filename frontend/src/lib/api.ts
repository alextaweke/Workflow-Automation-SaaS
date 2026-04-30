/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/api.ts - API Client
import axios from "axios";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { useAuthStore } from "@/stores/authStore";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
      toast.error("Session expired. Please login again.");
    } else if (error.response?.status === 403) {
      toast.error("You don't have permission to perform this action");
    } else if (error.response?.status === 404) {
      toast.error("Resource not found");
    } else if (error.response?.status === 500) {
      toast.error("Server error. Please try again later");
    } else {
      toast.error(error.response?.data?.message || "An error occurred");
    }
    return Promise.reject(error);
  },
);

// Workspace API
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

// Company API
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
// export const companyApi = {
//   getAll: (params?: any) => api.get("/companies/", { params }),
//   getById: (id: number) => api.get(`/companies/${id}/`),
//   create: (data: any) => api.post("/companies/", data),
//   update: (id: number, data: any) => api.put(`/companies/${id}/`, data),
//   delete: (id: number) => api.delete(`/companies/${id}/`),
//   getDepartments: (id: number) => api.get(`/companies/${id}/departments/`),
//   addDepartment: (id: number, data: any) =>
//     api.post(`/companies/${id}/add_department/`, data),
//   getStats: (id: number) => api.get(`/companies/${id}/stats/`),
// };

export const departmentApi = {
  getById: (id: number) => api.get(`/departments/${id}/`),
  update: (id: number, data: any) => api.patch(`/departments/${id}/`, data),
  delete: (id: number) => api.delete(`/departments/${id}/`),
  addMember: (id: number, userId: number) =>
    api.post(`/departments/${id}/add_member/`, { user_id: userId }),
  removeMember: (id: number, userId: number) =>
    api.delete(`/departments/${id}/remove_member/?user_id=${userId}`),
};
export default api;

// /* eslint-disable @typescript-eslint/no-explicit-any */
// // lib/api.ts
// import axios, {
//   AxiosInstance,
//   InternalAxiosRequestConfig,
//   AxiosError,
// } from "axios";
// import Cookies from "js-cookie";

// class ApiClient {
//   private api: AxiosInstance;
//   private isRefreshing = false;
//   private refreshSubscribers: ((token: string) => void)[] = [];

//   constructor() {
//     this.api = axios.create({
//       baseURL:
//         process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       timeout: 30000,
//     });

//     this.setupInterceptors();
//   }

//   private setupInterceptors() {
//     // Request interceptor
//     this.api.interceptors.request.use(
//       (config: InternalAxiosRequestConfig) => {
//         const token = Cookies.get("access_token");
//         if (token) {
//           config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//       },
//       (error) => Promise.reject(error),
//     );

//     // Response interceptor
//     this.api.interceptors.response.use(
//       (response) => response,
//       async (error: AxiosError) => {
//         const originalRequest = error.config as InternalAxiosRequestConfig & {
//           _retry?: boolean;
//         };

//         if (error.response?.status === 401 && !originalRequest._retry) {
//           if (this.isRefreshing) {
//             return new Promise((resolve) => {
//               this.refreshSubscribers.push((token: string) => {
//                 originalRequest.headers!.Authorization = `Bearer ${token}`;
//                 resolve(this.api(originalRequest));
//               });
//             });
//           }

//           originalRequest._retry = true;
//           this.isRefreshing = true;

//           try {
//             const refreshToken = Cookies.get("refresh_token");
//             if (!refreshToken) {
//               throw new Error("No refresh token");
//             }

//             const response = await axios.post(
//               `${this.api.defaults.baseURL}/auth/token/refresh/`,
//               {
//                 refresh: refreshToken,
//               },
//             );

//             const { access } = response.data;
//             Cookies.set("access_token", access, { expires: 1 });

//             this.onRefreshSuccess(access);

//             originalRequest.headers!.Authorization = `Bearer ${access}`;
//             return this.api(originalRequest);
//           } catch (refreshError) {
//             this.onRefreshFailure();
//             return Promise.reject(refreshError);
//           } finally {
//             this.isRefreshing = false;
//           }
//         }

//         return Promise.reject(error);
//       },
//     );
//   }

//   private onRefreshSuccess(token: string) {
//     this.refreshSubscribers.forEach((callback) => callback(token));
//     this.refreshSubscribers = [];
//   }

//   private onRefreshFailure() {
//     Cookies.remove("access_token");
//     Cookies.remove("refresh_token");
//     this.refreshSubscribers = [];
//     if (typeof window !== "undefined") {
//       window.location.href = "/login";
//     }
//   }

//   // Generic request methods with types
//   async get<T>(url: string, params?: any): Promise<T> {
//     const response = await this.api.get<T>(url, { params });
//     return response.data;
//   }

//   async post<T>(url: string, data?: any): Promise<T> {
//     const response = await this.api.post<T>(url, data);
//     return response.data;
//   }

//   async put<T>(url: string, data?: any): Promise<T> {
//     const response = await this.api.put<T>(url, data);
//     return response.data;
//   }

//   async patch<T>(url: string, data?: any): Promise<T> {
//     const response = await this.api.patch<T>(url, data);
//     return response.data;
//   }

//   async delete<T>(url: string): Promise<T> {
//     const response = await this.api.delete<T>(url);
//     return response.data;
//   }

//   // Direct access to axios instance
//   getInstance() {
//     return this.api;
//   }
// }

// const apiClient = new ApiClient();
// export const api = apiClient.getInstance();
// export default apiClient;
