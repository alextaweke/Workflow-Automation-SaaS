/* eslint-disable @typescript-eslint/no-explicit-any */
// types/index.ts
export interface User {
  id: number;
  uuid: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number?: string;
  avatar?: string;
  bio?: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  theme: string;
  language: string;
  timezone: string;
  last_seen?: string;
  date_joined: string;
  is_super_admin: boolean;
  active_companies_count: number;
}
export interface UserBasics {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}
export interface TaskForm {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
}
export interface Task {
  comments: any;
  id: number;
  uuid: string;
  title: string;
  description: string;

  workspace: number;
  workspace_details?: Workspace;
  company?: number; // Add this
  company_details?: {
    // Add this
    id: number;
    name: string;
    legal_name?: string;
  };
  department?: number; // Add this
  department_details?: {
    // Add this
    id: number;
    name: string;
    full_path: string;
  };

  parent_task?: number | null;
  parent_task_details?: Task | null;
  subtasks?: Task[];
  assigned_to?: number | null;
  assigned_to_details?: UserBasics | null;
  created_by: number;
  created_by_details?: User;
  collaborators?: number[];
  collaborators_details?: User[];
  status: "todo" | "in_progress" | "review" | "done" | "archived";
  priority: "low" | "medium" | "high" | "urgent" | "critical";
  tags: string[];
  due_date: string | number | Date;
  start_date?: string | null;

  estimated_hours?: number | null;
  actual_hours?: number | null;
  time_variance?: number;
  created_at: string;
  completion_percentage: number;
  is_deleted?: boolean;
  deleted_at?: string | null;
  last_modified_by?: number;
  absolute_url?: string;
  is_overdue?: boolean;
  completed_at?: string;
  updated_at: string;
}
export interface Workspace {
  task_count: number;
  workspace: string;
  memberships: never[];
  completed_tasks: number;
  days_until_expiry: import("react/jsx-runtime").JSX.Element;
  max_members: number;
  max_storage_mb: number;
  members: never[];
  total_tasks: number;
  id: number;
  uuid: string;
  name: string;
  description?: string;
  logo?: string;
  owner: number;
  owner_details?: User;
  plan: string;
  is_active: boolean;
  is_archived: boolean;
  member_count: number;
  created_at: string;
  settings?: Record<string, any>;
  features?: Record<string, any>;
}

export interface WorkspaceStats {
  total_members: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  totalWorkspaces: number;
  totalMembers: number;
  completedTasks: number;
  activePlan: string;
  tasks_by_status: Array<{ status: string; count: number }>;
  tasks_by_priority: Array<{ priority: string; count: number }>;
  subscription: {
    plan: string;
    is_active: boolean;
    days_until_expiry?: number;
    limits: {
      max_members: number;
      max_projects: number;
      max_storage_mb: number;
    };
  };
}

export interface TaskStats {
  completion_rate: any;
  in_progress_tasks: any;
  total_tasks: number;
  completed_tasks: number;
  in_progress: number;
  todo: number;
  overdue: number;
  high_priority: number;
  tasks_by_priority: Array<{ priority: string; count: number }>;
  tasks_by_status: Array<{ status: string; count: number }>;
  recent_tasks: Task[];
  avg_completion_time: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
}
// types/api.ts (New file for API response types)
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  total_pages: number;
  current_page: number;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface ErrorResponse {
  detail?: string;
  email?: string[];
  username?: string[];
  password?: string[];
  [key: string]: string | string[] | undefined;
}
// types/index.ts (Add this interface)
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  total_pages: number;
  current_page: number;
}
export interface TaskStatistics {
  total_tasks: number;
  completed_tasks: number;
  in_progress: number;
  todo: number;
  overdue: number;
  high_priority: number;
  tasks_by_priority: Array<{ priority: string; count: number }>;
  tasks_by_status: Array<{ status: string; count: number }>;
  recent_tasks: Task[];
}

export interface TimelineItem {
  id: number;
  title: string;
  start: string;
  end: string;
  status: string;
  priority: string;
  assignee: string | null;
  completion: number;
}
export interface Filters {
  status: string[];
  priority: string[];
  assigned_to?: number;
  workspace?: number;
  due_before?: string;
  due_after?: string;
  created_after?: string;
  search: string;
  tags?: string[];
  is_overdue?: boolean;
  page?: number;
  page_size?: number;
}

interface TaskFiltersProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}
export type TaskStatus =
  | "todo"
  | "in_progress"
  | "review"
  | "done"
  | "archived";

export type TaskPriority = "low" | "medium" | "high" | "urgent" | "critical";

export interface Member {
  id: number;
  user: number;
  user_details: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  role: string;
  joined_at: string;
  last_accessed: string | null;
}

export interface role {
  id: number;
  name: string;
  permissions: string[];
}
