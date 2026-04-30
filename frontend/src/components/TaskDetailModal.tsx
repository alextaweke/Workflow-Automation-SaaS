// components/tasks/TaskDetailModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useTaskStore } from "@/stores/taskStore";
import {
  X,
  User,
  Calendar,
  Clock,
  Tag,
  Flag,
  Edit2,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface TaskDetailModalProps {
  taskId: number;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function TaskDetailModal({
  taskId,
  isOpen,
  onClose,
  onUpdate,
}: TaskDetailModalProps) {
  const { currentTask, fetchTaskById, updateTask, deleteTask, isLoading } =
    useTaskStore();
  const [isEditing, setIsEditing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskById(taskId);
    }
  }, [isOpen, taskId, fetchTaskById]);

  useEffect(() => {
    if (currentTask) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditForm({
        title: currentTask.title,
        description: currentTask.description,
        status: currentTask.status,
        priority: currentTask.priority,
        due_date: currentTask.due_date?.slice(0, 16) || "",
        estimated_hours: currentTask.estimated_hours || "",
        tags: currentTask.tags || [],
      });
    }
  }, [currentTask]);

  const handleUpdate = async () => {
    try {
      await updateTask(taskId, editForm);
      toast.success("Task updated successfully");
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(taskId);
        toast.success("Task deleted successfully");
        onClose();
        if (onUpdate) onUpdate();
      } catch (error) {
        toast.error("Failed to delete task");
      }
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateTask(taskId, { status: newStatus });
      toast.success("Status updated");
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const priorityColors: Record<string, string> = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
    critical: "bg-purple-100 text-purple-800",
  };

  const statusColors: Record<string, string> = {
    todo: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    review: "bg-purple-100 text-purple-800",
    done: "bg-green-100 text-green-800",
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            currentTask && (
              <div>
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm({ ...editForm, title: e.target.value })
                          }
                          className="text-xl font-semibold text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      ) : (
                        <h3 className="text-xl font-semibold text-gray-900">
                          {currentTask.title}
                        </h3>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleDelete}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[currentTask.priority]}`}
                    >
                      <Flag className="h-3 w-3 inline mr-1" />
                      {currentTask.priority}
                    </span>
                    <select
                      value={currentTask.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${statusColors[currentTask.status]}`}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  {isEditing ? (
                    <textarea
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
                      placeholder="Description"
                    />
                  ) : (
                    currentTask.description && (
                      <p className="text-gray-600 mb-4">
                        {currentTask.description}
                      </p>
                    )
                  )}

                  <div className="space-y-3 text-sm">
                    {currentTask.assigned_to_details && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="h-4 w-4" />
                        <span>
                          Assigned to:{" "}
                          <strong>
                            {currentTask.assigned_to_details.username}
                          </strong>
                        </span>
                      </div>
                    )}

                    {currentTask.due_date && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Due:{" "}
                          {format(
                            new Date(currentTask.due_date),
                            "MMM dd, yyyy h:mm a",
                          )}
                        </span>
                      </div>
                    )}

                    {currentTask.estimated_hours && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          Estimated: {currentTask.estimated_hours} hours
                        </span>
                      </div>
                    )}

                    {currentTask.tags && currentTask.tags.length > 0 && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Tag className="h-4 w-4" />
                        <div className="flex gap-1">
                          {currentTask.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-gray-100 rounded-md text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentTask.completion_percentage > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{currentTask.completion_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 rounded-full h-2 transition-all"
                            style={{
                              width: `${currentTask.completion_percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
