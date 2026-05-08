"use client";

import { Task } from "@/types";
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PencilIcon,
  TrashIcon,
  FlagIcon,
  UserCircleIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onComplete: (task: Task) => void;
  viewMode: "grid" | "list";
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onComplete,
  viewMode,
}: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (viewMode === "grid") {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Link href={`/tasks/${task.id}`} className="block">
                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                  {task.title}
                </h3>
              </Link>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
                >
                  <FlagIcon className="w-3 h-3" />
                  {task.priority}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                >
                  {task.status === "done" ? (
                    <CheckCircleIcon className="w-3 h-3" />
                  ) : (
                    <ClockIcon className="w-3 h-3" />
                  )}
                  {task.status.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {task.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <UserCircleIcon className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">
                Assigned to {task.assigned_to_details?.username || "Unassigned"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {task.status !== "done" && (
                <button
                  onClick={() => onComplete(task)}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Mark complete"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onEdit(task)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit task"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete task"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 mt-3 pt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              <span>{new Date(task.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <ChatBubbleLeftRightIcon className="w-3 h-3" />
              <span>{task.comments?.length || 0} comments</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 p-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <Link href={`/tasks/${task.id}`} className="block">
            <h3 className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors">
              {task.title}
            </h3>
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
            >
              <FlagIcon className="w-3 h-3" />
              {task.priority}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
            >
              {task.status === "done" ? (
                <CheckCircleIcon className="w-3 h-3" />
              ) : (
                <ClockIcon className="w-3 h-3" />
              )}
              {task.status.replace("_", " ")}
            </span>
            <span className="text-xs text-gray-500">
              Due: {new Date(task.due_date).toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-600 text-sm line-clamp-1 mt-2">
            {task.description}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <UserCircleIcon className="w-4 h-4" />
              <span>{task.assigned_to_details?.username || "Unassigned"}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Created {new Date(task.created_at).toLocaleDateString()}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {task.status !== "done" && (
              <button
                onClick={() => onComplete(task)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Mark complete"
              >
                <CheckCircleIcon className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onEdit(task)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit task"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete task"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
