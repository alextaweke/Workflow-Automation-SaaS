// Backend Models (Exact match with Django serializers)
export interface User {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
}

export interface Workspace {
  id: number;
  name: string;
  owner: User;
  members: User[];
  created_at: string;
}

export interface Task {
  results: never[];
  id: number;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  assignee: User;
  workspace: Workspace;
  created_by: User;
  created_at: string;
  updated_at: string;
  due_date?: string;
}

// Auth
export interface AuthResponse {
  access: string;
  refresh: string;
}

export interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

// API Responses
export interface ApiResponse<T> {
  data: T;
  count: number;
  next: string | null;
  previous: string | null;
  results: T[]; // ✅ Single array of T
}

// Filter types
export type TaskFilter = "all" | "my" | "todo" | "in_progress" | "done";

// Form Errors
export interface FormErrors {
  [key: string]: string;
}
