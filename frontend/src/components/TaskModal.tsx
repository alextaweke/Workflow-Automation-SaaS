// components/TaskModal.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import { Task } from "@/types";
import { toast } from "react-hot-toast";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSuccess: () => void;
}

type TaskForm = {
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
};

const emptyForm: TaskForm = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  due_date: "",
};

export default function TaskModal({
  isOpen,
  onClose,
  task,
  onSuccess,
}: TaskModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<TaskForm>({
    defaultValues: emptyForm,
  });

  // Populate form when editing
  useEffect(() => {
    if (task) {
      reset({
        title: task.title ?? "",
        description: task.description ?? "",
        status: task.status ?? "todo",
        priority: task.priority ?? "medium",
        due_date: task.due_date ? task.due_date.split("T")[0] : "",
      });
    } else {
      reset(emptyForm);
    }
  }, [task, reset]);

  const onSubmit = async (data: TaskForm) => {
    try {
      if (task) {
        await api.patch(`/tasks/${task.id}/`, data);
        toast.success("Task updated successfully!");
      } else {
        await api.post("/tasks/", data);
        toast.success("Task created successfully!");
      }

      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Failed to save task");
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {task ? "Edit Task" : "Create New Task"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              {...register("title", { required: true })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task title"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task description"
            />
          </div>

          {/* Status */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              {...register("status")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Priority */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              {...register("priority")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Due Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input
              type="date"
              {...register("due_date")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : task ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
