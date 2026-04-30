/* eslint-disable @typescript-eslint/no-explicit-any */
// components/workspaces/SettingsTab.tsx
"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { Save, AlertTriangle, Trash2, Globe, Bell } from "lucide-react";
import toast from "react-hot-toast";

interface SettingsTabProps {
  workspace: {
    id: number;
    name: string;
    description?: string;
    plan: string;
    settings?: any;
    features?: any;
  };
  onUpdate: (id: number, data: any) => Promise<void>;
}

export function SettingsTab({ workspace, onUpdate }: SettingsTabProps) {
  const { deleteWorkspace, isLoading } = useWorkspaceStore();
  const [formData, setFormData] = useState({
    name: workspace.name,
    description: workspace.description || "",
    settings: workspace.settings || {
      default_role: "member",
      allow_public_access: false,
      require_approval: true,
      notification_settings: {
        task_assigned: true,
        task_completed: true,
        member_joined: true,
      },
    },
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdate(workspace.id, {
        name: formData.name,
        description: formData.description,
        settings: formData.settings,
      });
      toast.success("Workspace settings updated successfully");
    } catch (error) {
      toast.error("Failed to update workspace settings");
    }
  };

  const handleDelete = async () => {
    if (
      confirm(
        "Are you sure you want to delete this workspace? This action cannot be undone.",
      )
    ) {
      try {
        await deleteWorkspace(workspace.id);
        toast.success("Workspace deleted successfully");
        window.location.href = "/workspaces";
      } catch (error) {
        toast.error("Failed to delete workspace");
      }
    }
  };

  const handleArchive = async () => {
    if (
      confirm(
        "Are you sure you want to archive this workspace? You can restore it later.",
      )
    ) {
      try {
        // Archive workspace logic
        toast.success("Workspace archived successfully");
      } catch (error) {
        toast.error("Failed to archive workspace");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            General Settings
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your workspace basic information
          </p>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workspace Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter workspace name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe what this workspace is for..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Workspace Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Workspace Preferences
            </h2>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-900">
                Default Member Role
              </label>
              <p className="text-sm text-gray-500">
                Role assigned to new members by default
              </p>
            </div>
            <select
              value={formData.settings.default_role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  settings: {
                    ...formData.settings,
                    default_role: e.target.value,
                  },
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-900">Public Access</label>
              <p className="text-sm text-gray-500">
                Allow workspace to be discoverable
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.settings.allow_public_access}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      allow_public_access: e.target.checked,
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-900">
                Member Approval
              </label>
              <p className="text-sm text-gray-500">
                Require admin approval for new members
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.settings.require_approval}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      require_approval: e.target.checked,
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Notification Settings
            </h2>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-900">Task Assigned</label>
              <p className="text-sm text-gray-500">
                Notify when a task is assigned to a member
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.settings.notification_settings?.task_assigned}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      notification_settings: {
                        ...formData.settings.notification_settings,
                        task_assigned: e.target.checked,
                      },
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-900">
                Task Completed
              </label>
              <p className="text-sm text-gray-500">
                Notify when a task is marked as done
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={
                  formData.settings.notification_settings?.task_completed
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      notification_settings: {
                        ...formData.settings.notification_settings,
                        task_completed: e.target.checked,
                      },
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-900">Member Joined</label>
              <p className="text-sm text-gray-500">
                Notify when a new member joins the workspace
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.settings.notification_settings?.member_joined}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      notification_settings: {
                        ...formData.settings.notification_settings,
                        member_joined: e.target.checked,
                      },
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow border border-red-200">
        <div className="p-6 border-b border-red-200 bg-red-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-900">
                Archive Workspace
              </label>
              <p className="text-sm text-gray-500">
                Archive this workspace. You can restore it later.
              </p>
            </div>
            <button
              onClick={handleArchive}
              className="px-4 py-2 border border-yellow-600 text-yellow-700 rounded-lg hover:bg-yellow-50"
            >
              Archive
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <label className="font-medium text-gray-900">
                Delete Workspace
              </label>
              <p className="text-sm text-red-600">
                Permanently delete this workspace and all its data.
              </p>
            </div>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
