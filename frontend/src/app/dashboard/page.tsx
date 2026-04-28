"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { tasksAPI } from "@/lib/api";
import { Task, TaskFilter } from "@/types";
import { LogOut, Plus, Filter } from "lucide-react";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      // ✅ Type-safe API call
      const response = await tasksAPI.list({
        status: filter === "all" ? undefined : filter,
      });

      // ✅ Extract results correctly
      setTasks(response.data.results || []);
    } catch (error) {
      console.error("Fetch tasks error:", error);
      toast.error("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks();
  }, [fetchTasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Workflow Dashboard
            </h1>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
              {tasks.length} tasks
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 hidden md:block">
              Hi, {user?.email}
            </span>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-wrap gap-3 mb-8">
          {(["all", "my", "todo"] as TaskFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-medium transition-all shadow-sm ${
                filter === f
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:-translate-y-0.5"
                  : "bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md hover:shadow-gray-200/50"
              }`}
            >
              <Filter size={18} />
              <span>
                {f.charAt(0).toUpperCase() + f.slice(1).replace("_", " ")}
              </span>
            </button>
          ))}
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/20 border border-white/50 hover:border-indigo-200/50 transition-all duration-300 hover:-translate-y-2"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-xl text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {task.title}
                  </h3>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      task.status === "done"
                        ? "bg-green-100 text-green-800"
                        : task.status === "in_progress"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {task.status.replace("_", " ").toUpperCase()}
                  </div>
                </div>

                <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                  {task.description || "No description"}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {task.workspace.name}
                  </span>
                  <span className="text-xs font-medium text-indigo-600 truncate max-w-[120px]">
                    {task.assignee.email}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-24 col-span-full">
            <Plus className="mx-auto h-16 w-16 text-gray-400 mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No tasks yet
            </h3>
            <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
              Your workspace is ready. Create your first task to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
