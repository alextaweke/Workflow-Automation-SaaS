// components/SettingsTab.tsx (Updated for better visibility)
"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { Save, X } from "lucide-react";
import toast from "react-hot-toast";
import { Workspace } from "@/types";

interface SettingsTabProps {
  workspace: Workspace;
  onUpdate: (id: number, data: unknown) => Promise<void>;
  onClose?: () => void;
}

export function SettingsTab({
  workspace,
  onUpdate,
  onClose,
}: SettingsTabProps) {
  const [formData, setFormData] = useState({
    name: workspace.name || "",
    description: workspace.description || "",
    plan: workspace.plan || "free",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onUpdate(workspace.id, formData);
      toast.success("Workspace updated successfully!");
      if (onClose) onClose();
    } catch (error) {
      toast.error("Failed to update workspace");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Workspace Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          required
          placeholder="Enter workspace name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
          placeholder="Enter workspace description"
        />
        <p className="mt-1 text-xs text-gray-500">
          Describe what this workspace is for
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Plan
        </label>
        <select
          value={formData.plan}
          onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        >
          <option value="free">Free - $0/month</option>
          <option value="pro">Pro - $29/month</option>
          <option value="business">Business - $99/month</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          You can upgrade or downgrade at any time
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-sm"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </span>
          )}
        </button>
      </div>
    </form>
  );
}
