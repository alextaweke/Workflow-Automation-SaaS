/* eslint-disable @typescript-eslint/no-unused-vars */
// app/dashboard/page.tsx (Updated with proper types)
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";
import { Task, TaskStats, PaginatedResponse } from "@/types";
import { CreateTaskModal } from "@/components/CreateTaskModal";
import { TaskCard } from "@/components/TaskCard";
import { TaskFilters } from "@/components/TaskFilters";
import DashboardStats from "@/components/DashboardStats";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    search: "",
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const response = await apiClient.get<Task[] | PaginatedResponse<Task>>(
        "/tasks/",
      );

      const tasksList = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setTasks(tasksList);
      setFilteredTasks(tasksList);

      const statsResponse = await apiClient.get<TaskStats>("/tasks/dashboard/");

      setStats(statsResponse.data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, 0);

    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    let filtered = Array.isArray(tasks) ? [...tasks] : [];

    if (filters.status) {
      filtered = filtered.filter((task) => task.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter((task) => task.priority === filters.priority);
    }

    if (filters.search) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          task.description.toLowerCase().includes(filters.search.toLowerCase()),
      );
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilteredTasks(filtered);
  }, [filters, tasks]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.first_name || user?.username}!
          </h1>
          <p className="text-gray-600 mt-2">
            Heres whats happening with your tasks today.
          </p>
        </div>

        {/* Stats Dashboard */}
        {stats && <DashboardStats stats={stats} />}

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <TaskFilters filters={filters} setFilters={setFilters} />
          <button
            onClick={() => setOpenModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Task
          </button>
        </div>

        {/* Task List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new task.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTasks.map((task) => (
              <CreateTaskModal
                key={task.id}
                task={task}
                onEdit={setEditingTask}
                onDelete={handleDeleteTask}
                onComplete={handleTaskComplete}
                isOpen={false}
                onClose={function (): void {
                  throw new Error("Function not implemented.");
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Task Modal */}
      <CreateTaskModal
        isOpen={openModal || !!editingTask}
        onClose={() => {
          setOpenModal(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onSuccess={fetchTasks}
      />
    </div>
  );
}
