// app/tasks/my-tasks/page.tsx - My Tasks
"use client";

import { useEffect, useState } from "react";
import { useTaskStore } from "@/stores/taskStore";
import { TaskCard } from "@/components/TaskCard";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Task } from "@/types";
import MainLayout from "@/components/Layout/MainLayout";

export default function MyTasksPage() {
  const { myTasks, myTasksStats, fetchMyTasks, isLoading } = useTaskStore();

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const statusTabs = [
    { id: "all", label: "All Tasks", icon: null },
    { id: "todo", label: "To Do", icon: Clock },
    { id: "in_progress", label: "In Progress", icon: AlertCircle },
    { id: "done", label: "Completed", icon: CheckCircle2 },
  ];

  const [activeStatus, setActiveStatus] = useState("all");

  const filteredTasks = myTasks.filter((task: Task) =>
    activeStatus === "all" ? true : task.status === activeStatus,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-gray-600 mt-2">Tasks assigned to you</p>
          </div>

          {/* Stats */}
          {myTasksStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Assigned</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {myTasksStats.total}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {myTasksStats.completed}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">
                      {myTasksStats.overdue}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {myTasksStats.completion_rate}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b">
              <nav className="flex space-x-8 px-6">
                {statusTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveStatus(tab.id)}
                      className={`
                      flex items-center gap-2 py-4 px-1 border-b-2 transition
                      ${
                        activeStatus === tab.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }
                    `}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-6">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No tasks found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      viewMode="list"
                      onEdit={function (task: Task): void {
                        throw new Error("Function not implemented.");
                      }}
                      onDelete={function (id: number): void {
                        throw new Error("Function not implemented.");
                      }}
                      onComplete={function (task: Task): void {
                        throw new Error("Function not implemented.");
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
