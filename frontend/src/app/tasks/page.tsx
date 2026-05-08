/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Task, TaskStats, PaginatedResponse } from "@/types";
import { TaskCard } from "@/components/TaskCard";
import DashboardStats from "@/components/DashboardStats";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  BriefcaseIcon,
  ChartBarIcon,
  BellIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  CalendarIcon,
  FlagIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { FilterIcon } from "lucide-react";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import MainLayout from "@/components/Layout/MainLayout";

interface Filters {
  status: string[];
  priority: string[];
  search: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const [filters, setFilters] = useState<Filters>({
    status: [],
    priority: [],
    search: "",
  });

  const tasksPerPage = 12;

  const statusOptions = [
    { value: "todo", label: "To Do", color: "bg-yellow-100 text-yellow-800" },
    {
      value: "in_progress",
      label: "In Progress",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "review",
      label: "Review",
      color: "bg-purple-100 text-purple-800",
    },
    { value: "done", label: "Done", color: "bg-green-100 text-green-800" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
    {
      value: "medium",
      label: "Medium",
      color: "bg-yellow-100 text-yellow-800",
    },
    { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
    { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" },
    {
      value: "critical",
      label: "Critical",
      color: "bg-purple-100 text-purple-800",
    },
  ];

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get<Task[] | PaginatedResponse<Task>>(
        "/tasks/",
      );
      const tasksList = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      setTasks(tasksList);
      setFilteredTasks(tasksList);

      const statsResponse = await api.get<TaskStats>("/tasks/dashboard/");
      setStats(statsResponse.data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    let filtered = [...tasks];

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((task) =>
        filters.status.includes(task.status),
      );
    }

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter((task) =>
        filters.priority.includes(task.priority),
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower) ||
          task.tags?.some((tag) => tag.toLowerCase().includes(searchLower)),
      );
    }

    setFilteredTasks(filtered);
    setCurrentPage(1);
  }, [filters, tasks]);

  const handleSearch = () => {
    setFilters({ ...filters, search: searchInput });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const toggleStatus = (status: string) => {
    const current = filters.status;
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    setFilters({ ...filters, status: updated });
  };

  const togglePriority = (priority: string) => {
    const current = filters.priority;
    const updated = current.includes(priority)
      ? current.filter((p) => p !== priority)
      : [...current, priority];
    setFilters({ ...filters, priority: updated });
  };

  const clearFilters = () => {
    setFilters({ status: [], priority: [], search: "" });
    setSearchInput("");
  };

  const hasActiveFilters =
    filters.status.length > 0 || filters.priority.length > 0 || filters.search;

  const handleTaskComplete = async (task: Task) => {
    try {
      await api.patch(`/tasks/${task.id}/`, { status: "done" });
      toast.success(`Task "${task.title}" completed!`);
      fetchTasks();
    } catch (err) {
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/tasks/${id}/`);
      toast.success("Task deleted successfully");
      fetchTasks();
    } catch (err) {
      toast.error("Failed to delete task");
    }
  };

  const handleEditTask = (task: Task) => {
    router.push(`/tasks/edit/${task.id}`);
  };

  const handleCreateTask = () => {
    router.push("/tasks/create");
  };

  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Dashboard */}
          {stats && <DashboardStats stats={stats} />}

          {/* Search and Filter Bar - Upwork Style */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks by title, description, or tags..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Search
                </button>
                <button
                  onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                  className={`px-4 py-2.5 border rounded-lg transition flex items-center gap-2 ${
                    showFilterDrawer || hasActiveFilters
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <FilterIcon className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                      {filters.status.length + filters.priority.length}
                    </span>
                  )}
                </button>
              </div>

              {/* View Toggle */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition ${
                    viewMode === "grid"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  <Squares2X2Icon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition ${
                    viewMode === "list"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  <ListBulletIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={fetchTasks}
                  className="p-2 rounded-lg text-gray-600 hover:bg-white transition"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Drawer */}
            {showFilterDrawer && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Filter Tasks</h3>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear all
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Status Filters */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => toggleStatus(option.value)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                            filters.status.includes(option.value)
                              ? `${option.color} ring-2 ring-offset-1 ring-blue-500`
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Priority Filters */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {priorityOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => togglePriority(option.value)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                            filters.priority.includes(option.value)
                              ? `${option.color} ring-2 ring-offset-1 ring-blue-500`
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Active Filters Tags */}
            {hasActiveFilters && (
              <div className="mt-3 flex flex-wrap gap-2">
                {filters.status.map((status) => {
                  const option = statusOptions.find((o) => o.value === status);
                  return (
                    <span
                      key={status}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${option?.color}`}
                    >
                      {option?.label}
                      <button
                        onClick={() => toggleStatus(status)}
                        className="hover:opacity-70"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
                {filters.priority.map((priority) => {
                  const option = priorityOptions.find(
                    (o) => o.value === priority,
                  );
                  return (
                    <span
                      key={priority}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${option?.color}`}
                    >
                      {option?.label}
                      <button
                        onClick={() => togglePriority(priority)}
                        className="hover:opacity-70"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
                {filters.search && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    Search: {filters.search}
                    <button
                      onClick={() => {
                        setFilters({ ...filters, search: "" });
                        setSearchInput("");
                      }}
                      className="hover:opacity-70"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Found{" "}
              <span className="font-semibold text-gray-900">
                {filteredTasks.length}
              </span>{" "}
              tasks
            </p>
            {viewMode === "grid" && (
              <p className="text-xs text-gray-400">
                {currentTasks.length} shown per page
              </p>
            )}
          </div>

          {/* Task List */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
              <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No tasks found
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Try adjusting your filters or create a new task.
              </p>
              <button
                onClick={handleCreateTask}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="w-4 h-4" />
                Create Task
              </button>
            </div>
          ) : (
            <>
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "space-y-4"
                }
              >
                {currentTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onComplete={handleTaskComplete}
                    viewMode={viewMode}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing {indexOfFirstTask + 1} to{" "}
                    {Math.min(indexOfLastTask, filteredTasks.length)} of{" "}
                    {filteredTasks.length} tasks
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <div className="flex gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                                currentPage === pageNum
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        },
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
