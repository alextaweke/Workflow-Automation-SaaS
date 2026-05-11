/* eslint-disable react-hooks/set-state-in-effect */
// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Task, TaskStats, PaginatedResponse } from "@/types";
import MainLayout from "@/components/Layout/MainLayout";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import Link from "next/link";
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
  XMarkIcon,
  CalendarIcon,
  UserGroupIcon,
  ChartBarIcon,
  SparklesIcon,
  BriefcaseIcon,
  FireIcon,
} from "@heroicons/react/24/outline";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { Pie, Bar, Line, Doughnut } from "react-chartjs-2";
import { FilterIcon, StarIcon } from "lucide-react";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler,
);

interface Filters {
  status: string[];
  priority: string[];
  search: string;
}

interface AnalyticsData {
  tasksByStatus: { [key: string]: number };
  tasksByPriority: { [key: string]: number };
  weeklyProgress: { day: string; completed: number; created: number }[];
  completionRate: number;
  averageCompletionTime: number | null;
  overdueTasks: number;
  upcomingDeadlines: Task[];
}

export default function DashboardPage() {
  const router = useRouter();
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const user = useAuthStore((state) => state.user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");
  const [filters, setFilters] = useState<Filters>({
    status: [],
    priority: [],
    search: "",
  });

  const tasksPerPage = 12;

  const statusOptions = [
    {
      value: "todo",
      label: "To Do",
      color: "bg-yellow-100 text-yellow-800",
      icon: "📋",
    },
    {
      value: "in_progress",
      label: "In Progress",
      color: "bg-blue-100 text-blue-800",
      icon: "⚡",
    },
    {
      value: "review",
      label: "Review",
      color: "bg-purple-100 text-purple-800",
      icon: "🔍",
    },
    {
      value: "done",
      label: "Done",
      color: "bg-green-100 text-green-800",
      icon: "✅",
    },
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
      await fetchAnalytics(tasksList);

      const statsResponse = await api.get<TaskStats>("/tasks/dashboard/");
      setStats(statsResponse.data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (tasksList: Task[]) => {
    // Calculate analytics from tasks
    const tasksByStatus = tasksList.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number },
    );

    const tasksByPriority = tasksList.reduce(
      (acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number },
    );

    const completedTasks = tasksList.filter((t) => t.status === "done");
    const completionRate = tasksList.length
      ? (completedTasks.length / tasksList.length) * 100
      : 0;

    const now = new Date();
    const upcomingDeadlines = tasksList
      .filter(
        (t) => t.due_date && new Date(t.due_date) > now && t.status !== "done",
      )
      .sort(
        (a, b) =>
          new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime(),
      )
      .slice(0, 5);

    const overdueTasks = tasksList.filter(
      (t) => t.is_overdue && t.status !== "done",
    ).length;

    // Generate weekly progress data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });

    const weeklyProgress = last7Days.map((day) => ({
      day: new Date(day).toLocaleDateString("en-US", { weekday: "short" }),
      completed: tasksList.filter(
        (t) => t.completed_at && t.completed_at.split("T")[0] === day,
      ).length,
      created: tasksList.filter((t) => t.created_at.split("T")[0] === day)
        .length,
    }));

    setAnalytics({
      tasksByStatus,
      tasksByPriority,
      weeklyProgress,
      completionRate,
      averageCompletionTime: null,
      overdueTasks,
      upcomingDeadlines,
    });
  };

  useEffect(() => {
    fetchTasks();
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    let filtered = [...tasks];

    if (filters.status.length > 0) {
      filtered = filtered.filter((task) =>
        filters.status.includes(task.status),
      );
    }
    if (filters.priority.length > 0) {
      filtered = filtered.filter((task) =>
        filters.priority.includes(task.priority),
      );
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.tags?.some((tag) => tag.toLowerCase().includes(searchLower)),
      );
    }

    setFilteredTasks(filtered);
    setCurrentPage(1);
  }, [filters, tasks]);

  const handleSearch = () => setFilters({ ...filters, search: searchInput });
  const handleKeyPress = (e: React.KeyboardEvent) =>
    e.key === "Enter" && handleSearch();

  const toggleStatus = (status: string) => {
    const updated = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    setFilters({ ...filters, status: updated });
  };

  const togglePriority = (priority: string) => {
    const updated = filters.priority.includes(priority)
      ? filters.priority.filter((p) => p !== priority)
      : [...filters.priority, priority];
    setFilters({ ...filters, priority: updated });
  };

  const clearFilters = () => {
    setFilters({ status: [], priority: [], search: "" });
    setSearchInput("");
  };

  const hasActiveFilters =
    filters.status.length > 0 || filters.priority.length > 0 || filters.search;

  // Chart configurations
  const statusChartData = {
    labels: Object.keys(analytics?.tasksByStatus || {}).map((s) =>
      s.replace("_", " ").toUpperCase(),
    ),
    datasets: [
      {
        data: Object.values(analytics?.tasksByStatus || {}),
        backgroundColor: ["#FBBF24", "#3B82F6", "#8B5CF6", "#10B981"],
        borderWidth: 0,
      },
    ],
  };

  const priorityChartData = {
    labels: Object.keys(analytics?.tasksByPriority || {}).map((p) =>
      p.toUpperCase(),
    ),
    datasets: [
      {
        data: Object.values(analytics?.tasksByPriority || {}),
        backgroundColor: [
          "#10B981",
          "#FBBF24",
          "#F97316",
          "#EF4444",
          "#8B5CF6",
        ],
        borderWidth: 0,
      },
    ],
  };

  const weeklyProgressData = {
    labels: analytics?.weeklyProgress.map((w) => w.day) || [],
    datasets: [
      {
        label: "Tasks Created",
        data: analytics?.weeklyProgress.map((w) => w.created) || [],
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "#3B82F6",
        borderWidth: 2,
      },
      {
        label: "Tasks Completed",
        data: analytics?.weeklyProgress.map((w) => w.completed) || [],
        backgroundColor: "rgba(16, 185, 129, 0.5)",
        borderColor: "#10B981",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { font: { size: 12 } },
      },
    },
  };

  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section with Stats Cards */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {user?.first_name || user?.username || "User"}!
                </h1>
                <p className="text-gray-600">
                  Here s your workspace overview and task analytics
                </p>
              </div>
              {(user?.role === "admin" || user?.role === "owner") && (
                <button
                  onClick={() => router.push("/tasks/create")}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-shadow"
                >
                  <PlusIcon className="w-5 h-5" />
                  New Task
                </button>
              )}
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BriefcaseIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {tasks.length}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600">
                  Total Tasks
                </h3>
                <p className="text-xs text-gray-400 mt-1">All time tasks</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {analytics?.completionRate.toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600">
                  Completion Rate
                </h3>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-green-600 rounded-full h-1.5 transition-all"
                    style={{ width: `${analytics?.completionRate || 0}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FireIcon className="w-6 h-6 text-red-600" />
                  </div>
                  <span className="text-2xl font-bold text-red-600">
                    {analytics?.overdueTasks || 0}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600">
                  Overdue Tasks
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Need immediate attention
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUpIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {stats?.avg_completion_time
                      ? `${Math.round(stats.avg_completion_time)}h`
                      : "N/A"}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600">
                  Avg. Completion Time
                </h3>
                <p className="text-xs text-gray-400 mt-1">Per task</p>
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Status Distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Task Status
                </h3>
                <ChartBarIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-64">
                <Doughnut data={statusChartData} options={chartOptions} />
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Priority Levels
                </h3>
                <SparklesIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-64">
                <Pie data={priorityChartData} options={chartOptions} />
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Upcoming Deadlines
                </h3>
                <CalendarIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                {analytics?.upcomingDeadlines.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No upcoming deadlines
                  </p>
                ) : (
                  analytics?.upcomingDeadlines.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          Due: {new Date(task.due_date!).toLocaleDateString()}
                        </p>
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-xs ${priorityOptions.find((p) => p.value === task.priority)?.color}`}
                      >
                        {task.priority}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Weekly Progress Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Weekly Progress
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Tasks created vs completed over time
                </p>
              </div>
              <div className="flex gap-2">
                {(["week", "month", "year"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded-lg text-sm transition ${
                      timeRange === range
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-80">
              <Bar data={weeklyProgressData} options={chartOptions} />
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
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
                          <span className="mr-1">{option.icon}</span>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
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

          {/* Results Header */}
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Found{" "}
              <span className="font-semibold text-gray-900">
                {filteredTasks.length}
              </span>{" "}
              tasks
            </p>
          </div>

          {/* Task Grid/List */}
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
                onClick={() => router.push("/tasks/create")}
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
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                }
              >
                {currentTasks.map((task) => (
                  <TaskCard key={task.id} task={task} viewMode={viewMode} />
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
                          if (totalPages <= 5) pageNum = i + 1;
                          else if (currentPage <= 3) pageNum = i + 1;
                          else if (currentPage >= totalPages - 2)
                            pageNum = totalPages - 4 + i;
                          else pageNum = currentPage - 2 + i;
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

// Simplified TaskCard Component
function TaskCard({
  task,
  viewMode,
}: {
  task: Task;
  viewMode: "grid" | "list";
}) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-purple-100 text-purple-800";
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "todo":
        return "📋";
      case "in_progress":
        return "⚡";
      case "review":
        return "🔍";
      case "done":
        return "✅";
      default:
        return "📌";
    }
  };

  if (viewMode === "list") {
    return (
      <Link
        href={`/tasks/${task.id}`}
        className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="text-2xl">{getStatusIcon(task.status)}</div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{task.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-1">
                {task.description || "No description"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
              >
                {task.priority.toUpperCase()}
              </span>
              {task.due_date && (
                <span className="text-xs text-gray-500">
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-2xl">{getStatusIcon(task.status)}</div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
        >
          {task.priority}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
        {task.title}
      </h3>
      <p className="text-sm text-gray-500 line-clamp-2 mb-4">
        {task.description || "No description"}
      </p>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
        {task.due_date && (
          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
        )}
      </div>
    </Link>
  );
}
