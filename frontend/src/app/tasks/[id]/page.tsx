/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/tasks/[id]/page.tsx - Task Detail Page
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Task } from "@/types";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  FlagIcon,
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  ShareIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  UsersIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";
import MainLayout from "@/components/Layout/MainLayout";
import { Briefcase, Building2 } from "lucide-react";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const taskId = parseInt(params.id as string);

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "details" | "comments" | "activity"
  >("details");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    status: "",
    priority: "",
    due_date: "",
    start_date: "",
    estimated_hours: "",
  });

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tasks/${taskId}/`);
      // Handle both response.data format and the nested results format
      const taskData = response.data.results?.tasks?.[0] || response.data;
      setTask(taskData);
      setEditForm({
        title: taskData.title,
        description: taskData.description || "",
        status: taskData.status,
        priority: taskData.priority,
        due_date: taskData.due_date ? taskData.due_date.slice(0, 16) : "",
        start_date: taskData.start_date ? taskData.start_date.slice(0, 16) : "",
        estimated_hours: taskData.estimated_hours?.toString() || "",
      });
    } catch (error) {
      console.error("Failed to fetch task details:", error);
      toast.error("Failed to load task details");
      router.push("/tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const handleUpdateTask = async () => {
    try {
      const response = await api.patch(`/tasks/${taskId}/`, editForm);
      setTask(response.data);
      setIsEditing(false);
      toast.success("Task updated successfully");
      fetchTaskDetails();
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}/`);
      toast.success("Task deleted successfully");
      router.push("/tasks");
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleCompleteTask = async () => {
    if (!task) return;
    const newStatus = task.status === "done" ? "todo" : "done";
    try {
      await api.patch(`/tasks/${taskId}/`, { status: newStatus });
      toast.success(newStatus === "done" ? "Task completed!" : "Task reopened");
      fetchTaskDetails();
    } catch (error) {
      console.error("Failed to update task status:", error);
      toast.error("Failed to update task status");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "urgent":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "review":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "todo":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "archived":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
      case "urgent":
      case "high":
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      default:
        return <FlagIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Task not found
          </h2>
          <p className="mt-2 text-gray-600">
            The task you are looking for does not exist.
          </p>
          <Link
            href="/tasks"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/tasks"
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </Link>
                {!isEditing ? (
                  <h1 className="text-2xl font-bold text-gray-900">
                    {task.title}
                  </h1>
                ) : (
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none px-2 py-1"
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCompleteTask}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    task.status === "done"
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  {task.status === "done" ? "Reopen Task" : "Mark Complete"}
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDeleteTask}
                  className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status and Priority Badges */}
              <div className="flex gap-3 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(task.status)}`}
                >
                  {task.status === "done" ? (
                    <CheckCircleSolidIcon className="w-4 h-4" />
                  ) : (
                    <ClockIcon className="w-4 h-4" />
                  )}
                  {task.status.replace(/_/g, " ").toUpperCase()}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getPriorityColor(task.priority)}`}
                >
                  {getPriorityIcon(task.priority)}
                  {task.priority.toUpperCase()}
                </span>
                {task.is_overdue && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border bg-red-100 text-red-800 border-red-200">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    OVERDUE
                  </span>
                )}
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex gap-8">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`pb-3 px-1 text-sm font-medium transition-colors ${
                      activeTab === "details"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={`pb-3 px-1 text-sm font-medium transition-colors ${
                      activeTab === "comments"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Comments
                  </button>
                  <button
                    onClick={() => setActiveTab("activity")}
                    className={`pb-3 px-1 text-sm font-medium transition-colors ${
                      activeTab === "activity"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Activity
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {activeTab === "details" && (
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Description
                      </h3>
                      {!isEditing ? (
                        <p className="text-gray-600 whitespace-pre-wrap">
                          {task.description || "No description provided."}
                        </p>
                      ) : (
                        <textarea
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              description: e.target.value,
                            })
                          }
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Task description..."
                        />
                      )}
                    </div>

                    {/* Task Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div className="flex items-start gap-3">
                        <BriefcaseIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Workspace</p>
                          <p className="text-sm font-medium text-gray-900">
                            {task.workspace_details?.name ||
                              `Workspace ${task.workspace}`}
                            {task.workspace_details?.plan && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({task.workspace_details.plan})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Company</p>
                          <p className="text-sm font-medium text-gray-900">
                            {task.company_details?.name ||
                              `Company ${task.company}`}
                            {task.company_details?.legal_name && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({task.company_details.legal_name})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Department</p>
                          <p className="text-sm font-medium text-gray-900">
                            {task.department_details?.full_path ||
                              task.department_details?.name ||
                              `Department ${task.department}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <UserIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Assigned To</p>
                          <p className="text-sm font-medium text-gray-900">
                            {task.assigned_to_details
                              ? `${task.assigned_to_details.first_name} ${task.assigned_to_details.last_name}`.trim() ||
                                task.assigned_to_details.username
                              : "Unassigned"}
                          </p>
                          {task.assigned_to_details?.email && (
                            <p className="text-xs text-gray-500">
                              {task.assigned_to_details.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Due Date</p>
                          {!isEditing ? (
                            <p className="text-sm font-medium text-gray-900">
                              {task.due_date
                                ? new Date(task.due_date).toLocaleString()
                                : "No due date"}
                            </p>
                          ) : (
                            <input
                              type="datetime-local"
                              value={editForm.due_date}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  due_date: e.target.value,
                                })
                              }
                              className="mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Start Date</p>
                          {!isEditing ? (
                            <p className="text-sm font-medium text-gray-900">
                              {task.start_date
                                ? new Date(task.start_date).toLocaleString()
                                : "Not started"}
                            </p>
                          ) : (
                            <input
                              type="datetime-local"
                              value={editForm.start_date}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  start_date: e.target.value,
                                })
                              }
                              className="mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <ClockIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">
                            Estimated Hours
                          </p>
                          {!isEditing ? (
                            <p className="text-sm font-medium text-gray-900">
                              {task.estimated_hours
                                ? `${task.estimated_hours} hours`
                                : "Not set"}
                            </p>
                          ) : (
                            <input
                              type="number"
                              step="0.5"
                              value={editForm.estimated_hours}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  estimated_hours: e.target.value,
                                })
                              }
                              className="mt-1 px-2 py-1 border border-gray-300 rounded text-sm w-24"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <ClockIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Actual Hours</p>
                          <p className="text-sm font-medium text-gray-900">
                            {task.actual_hours
                              ? `${task.actual_hours} hours`
                              : "0 hours"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <UserIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Created By</p>
                          <p className="text-sm font-medium text-gray-900">
                            {task.created_by_details
                              ? `${task.created_by_details.first_name} ${task.created_by_details.last_name}`.trim() ||
                                task.created_by_details.username
                              : `User ${task.created_by}`}
                          </p>
                          {task.created_by_details?.email && (
                            <p className="text-xs text-gray-500">
                              {task.created_by_details.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Created At</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(task.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Last Updated</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(task.updated_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {task.completed_at && (
                        <div className="flex items-start gap-3">
                          <CheckCircleIcon className="w-5 h-5 text-green-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">
                              Completed At
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(task.completed_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <TagIcon className="w-4 h-4" />
                          Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {task.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Collaborators */}
                    {task.collaborators_details &&
                      task.collaborators_details.length > 0 && (
                        <div className="pt-4 border-t border-gray-100">
                          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <UsersIcon className="w-4 h-4" />
                            Collaborators ({task.collaborators_details.length})
                          </h3>
                          <div className="space-y-2">
                            {task.collaborators_details.map(
                              (collaborator: any) => (
                                <div
                                  key={collaborator.id}
                                  className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                                >
                                  <UserIcon className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {collaborator.first_name}{" "}
                                      {collaborator.last_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {collaborator.email}
                                    </p>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {/* Parent Task */}
                    {task.parent_task_details && (
                      <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">
                          Parent Task
                        </h3>
                        <Link
                          href={`/tasks/${task.parent_task}`}
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                        >
                          <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {task.parent_task_details.title}
                          </span>
                        </Link>
                      </div>
                    )}

                    {/* Subtasks */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">
                          Subtasks ({task.subtasks.length})
                        </h3>
                        <div className="space-y-2">
                          {task.subtasks.map((subtask: any) => (
                            <Link
                              key={subtask.id}
                              href={`/tasks/${subtask.id}`}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                              <input
                                type="checkbox"
                                checked={subtask.status === "done"}
                                readOnly
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm text-gray-700 flex-1">
                                {subtask.title}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded ${getStatusColor(subtask.status)}`}
                              >
                                {subtask.status}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Edit Actions */}
                    {isEditing && (
                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateTask}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "comments" && (
                  <div className="text-center py-12">
                    <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No comments yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Be the first to comment on this task.
                    </p>
                  </div>
                )}

                {activeTab === "activity" && (
                  <div className="text-center py-12">
                    <ArrowPathIcon className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Activity log
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Recent activity will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Progress Card */}
              {task.completion_percentage > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Progress
                  </h3>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Completion</span>
                    <span className="font-semibold">
                      {task.completion_percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 rounded-full h-2 transition-all"
                      style={{ width: `${task.completion_percentage}%` }}
                    />
                  </div>
                  {task.time_variance !== undefined &&
                    task.time_variance !== 0 && (
                      <div className="mt-3 text-xs text-gray-500">
                        Time variance: {task.time_variance}%
                      </div>
                    )}
                </div>
              )}

              {/* Actions Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Actions
                </h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition">
                    <ShareIcon className="w-4 h-4" />
                    Share Task
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition">
                    <PaperClipIcon className="w-4 h-4" />
                    Attach File
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition">
                    <UsersIcon className="w-4 h-4" />
                    Add Collaborator
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition">
                    <ArchiveBoxIcon className="w-4 h-4" />
                    Archive Task
                  </button>
                </div>
              </div>

              {/* Task UUID (for developers) */}
              {process.env.NODE_ENV === "development" && task.uuid && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500">Task UUID</p>
                  <p className="text-xs font-mono text-gray-600 break-all">
                    {task.uuid}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
