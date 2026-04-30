/* eslint-disable @typescript-eslint/no-unused-vars */

// components/tasks/TaskCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTaskStore } from "@/stores/taskStore";
import {
  Calendar,
  User,
  Tag,
  ChevronRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import toast from "react-hot-toast";
import { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  viewMode: "grid" | "list";
}

export function TaskCard({ task, viewMode }: TaskCardProps) {
  const router = useRouter();
  const { updateTask } = useTaskStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const priorityColors = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
    critical: "bg-purple-100 text-purple-800",
  };

  const statusColors = {
    todo: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    review: "bg-purple-100 text-purple-800",
    done: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-800",
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await updateTask(task.id, { status: newStatus });
      toast.success("Task status updated");
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const isOverdue = task.is_overdue && task.status !== "done";

  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3
                className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                onClick={() => router.push(`/tasks/${task.id}`)}
              >
                {task.title}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}
              >
                {task.priority}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}
              >
                {task.status.replace("_", " ")}
              </span>
              {isOverdue && (
                <span className="flex items-center gap-1 text-red-600 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  Overdue
                </span>
              )}
            </div>

            {task.description && (
              <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500">
              {task.assigned_to_details && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{task.assigned_to_details.username}</span>
                </div>
              )}
              {task.due_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Due {formatDistanceToNow(new Date(task.due_date))} ago
                  </span>
                </div>
              )}
              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  <span>{task.tags.slice(0, 2).join(", ")}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdating}
              className="px-3 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
            <button
              onClick={() => router.push(`/tasks/${task.id}`)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition">
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3
            className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
            onClick={() => router.push(`/tasks/${task.id}`)}
          >
            {task.title}
          </h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}
          >
            {task.priority}
          </span>
        </div>

        {task.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="space-y-2 mb-4">
          {task.assigned_to_details && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{task.assigned_to_details.username}</span>
            </div>
          )}
          {task.due_date && (
            <div
              className="flex items-center gap-2 text-sm"
              //className={isOverdue ? "text-red-600" : "text-gray-600"}
            >
              <Calendar className="h-4 w-4" />
              <span>Due {format(new Date(task.due_date), "MMM dd, yyyy")}</span>
              {isOverdue && (
                <span className="text-red-600 text-xs">(Overdue)</span>
              )}
            </div>
          )}
          {task.estimated_hours && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{task.estimated_hours} hours est.</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}
          >
            {task.status.replace("_", " ")}
          </span>
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isUpdating}
            className="text-sm border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>
    </div>
  );
}
