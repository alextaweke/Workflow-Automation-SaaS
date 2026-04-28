import axios, { AxiosResponse, AxiosError } from "axios";
import Cookies from "js-cookie";
import { ApiResponse, Task, User, Workspace } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Typed API methods
export const authAPI = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post("/auth/register/", data),
  login: (data: { email: string; password: string }) =>
    api.post<{ access: string; refresh: string }>("/auth/token/", data),
  me: () => api.get<User>("/users/me/"),
};

export const tasksAPI = {
  list: async (params?: {
    workspace?: number;
    status?: string;
  }): Promise<ApiResponse<Task>> => {
    const response = await api.get<ApiResponse<Task>>("/tasks/", { params });
    return response.data;
  },

  myTasks: async (): Promise<ApiResponse<Task>> => {
    const response = await api.get<ApiResponse<Task>>("/tasks/my_tasks/");
    return response.data;
  },

  todo: async (): Promise<ApiResponse<Task>> => {
    const response = await api.get<ApiResponse<Task>>("/tasks/todo/");
    return response.data;
  },
};
export const workspacesAPI = {
  list: () => api.get<ApiResponse<Workspace[]>>("/workspaces/"),
  create: (data: { name: string }) => api.post<Workspace>("/workspaces/", data),
};

export default api;
