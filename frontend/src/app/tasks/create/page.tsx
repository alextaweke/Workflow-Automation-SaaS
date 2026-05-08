/* eslint-disable @typescript-eslint/no-explicit-any */
// app/tasks/create/page.tsx - Add user fetching

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTaskStore } from "@/stores/taskStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import {
  Calendar,
  Clock,
  Tag,
  User,
  AlertCircle,
  ArrowLeft,
  X,
  Building2,
  Briefcase,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import MainLayout from "@/components/Layout/MainLayout";
import api from "@/lib/api";

interface Workspace {
  id: number;
  name: string;
}

interface Company {
  id: number;
  name: string;
  legal_name?: string;
}

interface Department {
  id: number;
  name: string;
  full_path: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export default function CreateTaskPage() {
  const router = useRouter();
  const { createTask, isLoading } = useTaskStore();
  const { workspaces, fetchWorkspaces } = useWorkspaceStore();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    workspace: "",
    company: "",
    department: "",
    assigned_to: "",
    collaborators: [] as number[],
    status: "todo",
    priority: "medium",
    tags: [] as string[],
    due_date: "",
    start_date: "",
    estimated_hours: "",
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (workspaces.length === 0) {
      fetchWorkspaces();
    }
  }, [workspaces.length, fetchWorkspaces]);

  // Fetch companies when workspace changes
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!formData.workspace) {
        setCompanies([]);
        return;
      }

      setLoadingCompanies(true);
      try {
        const response = await api.get(
          `/companies/?workspace_id=${formData.workspace}`,
        );
        setCompanies(response.data);
      } catch (error) {
        console.error("Failed to fetch companies:", error);
        toast.error("Failed to load companies");
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, [formData.workspace]);

  // Fetch departments when company changes
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!formData.company) {
        setDepartments([]);
        return;
      }

      setLoadingDepartments(true);
      try {
        const response = await api.get(
          `/companies/${formData.company}/departments/`,
        );
        setDepartments(response.data);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
        toast.error("Failed to load departments");
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [formData.company]);

  // Fetch workspace members when workspace changes
  useEffect(() => {
    const fetchWorkspaceMembers = async () => {
      if (!formData.workspace) {
        setUsers([]);
        return;
      }

      setLoadingUsers(true);
      try {
        // Fetch workspace members from the workspace endpoint
        const response = await api.get(
          `/workspaces/${formData.workspace}/members/`,
        );
        // The response contains memberships with user_details
        const members = response.data.map(
          (membership: any) => membership.user_details,
        );
        setUsers(members);
      } catch (error) {
        console.error("Failed to fetch workspace members:", error);
        // Fallback: try to get all users
        try {
          const usersResponse = await api.get("/auth/users/");
          setUsers(usersResponse.data);
        } catch (err) {
          console.error("Failed to fetch users:", err);
        }
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchWorkspaceMembers();
  }, [formData.workspace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate due date
    if (formData.due_date && new Date(formData.due_date) < new Date()) {
      toast.error("Due date cannot be in the past");
      return;
    }

    // Validate estimated hours
    if (
      formData.estimated_hours &&
      (parseFloat(formData.estimated_hours) < 0 ||
        parseFloat(formData.estimated_hours) > 1000)
    ) {
      toast.error("Estimated hours must be between 0 and 1000");
      return;
    }

    // Validate tags limit
    if (formData.tags.length > 20) {
      toast.error("Maximum 20 tags allowed");
      return;
    }

    const submitData = {
      ...formData,
      estimated_hours: formData.estimated_hours
        ? parseFloat(formData.estimated_hours)
        : null,
      due_date: formData.due_date || null,
      start_date: formData.start_date || null,
      assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
      workspace: parseInt(formData.workspace),
      company: formData.company ? parseInt(formData.company) : null,
      department: formData.department ? parseInt(formData.department) : null,
    };

    try {
      await createTask(submitData);
      toast.success("Task created successfully!");
      router.push("/tasks");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.due_date?.[0] ||
        "Failed to create task";
      toast.error(errorMessage);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      if (formData.tags.length >= 20) {
        toast.error("Maximum 20 tags allowed");
        return;
      }
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Link
              href="/tasks"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Tasks
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Create New Task
                </h1>
                <p className="text-gray-600 mt-1">
                  Fill in the details to create a new task
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter task title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the task..."
                />
              </div>

              {/* Workspace */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace *
                </label>
                <select
                  required
                  value={formData.workspace}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      workspace: e.target.value,
                      company: "",
                      department: "",
                      assigned_to: "",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select workspace</option>
                  {workspaces.map((workspace: Workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  Company
                </label>
                <select
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company: e.target.value,
                      department: "",
                    })
                  }
                  disabled={!formData.workspace || loadingCompanies}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select company (optional)</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {loadingCompanies && (
                  <p className="text-xs text-gray-500 mt-1">
                    Loading companies...
                  </p>
                )}
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Briefcase className="h-4 w-4 inline mr-1" />
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  disabled={!formData.company || loadingDepartments}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select department (optional)</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.full_path || department.name}
                    </option>
                  ))}
                </select>
                {loadingDepartments && (
                  <p className="text-xs text-gray-500 mt-1">
                    Loading departments...
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {/* Assigned To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="h-4 w-4 inline mr-1" />
                    Assign To
                  </label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) =>
                      setFormData({ ...formData, assigned_to: e.target.value })
                    }
                    disabled={!formData.workspace || loadingUsers}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name || user.username}{" "}
                        {user.last_name || ""} ({user.email})
                      </option>
                    ))}
                  </select>
                  {loadingUsers && (
                    <p className="text-xs text-gray-500 mt-1">
                      Loading workspace members...
                    </p>
                  )}
                  {!formData.workspace && (
                    <p className="text-xs text-gray-500 mt-1">
                      Select a workspace first
                    </p>
                  )}
                </div>

                {/* Estimated Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Estimated Hours (0-1000)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="1000"
                    value={formData.estimated_hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimated_hours: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Hours"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Due Date (cannot be in past)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Tag className="h-4 w-4 inline mr-1" />
                  Tags (max 20)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add a tag and press Enter"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Link
                  href="/tasks"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
