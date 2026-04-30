// components/workspaces/InviteMemberModal.tsx
"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { X, Mail, Send, UserPlus } from "lucide-react";
import toast from "react-hot-toast";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: number;
  onSuccess?: () => void;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  workspaceId,
  onSuccess,
}: InviteMemberModalProps) {
  const { inviteMember, isLoading } = useWorkspaceStore();
  const [formData, setFormData] = useState({
    email: "",
    role: "member",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await inviteMember(workspaceId, formData.email, formData.role);
      toast.success(`Invitation sent to ${formData.email}`);
      setFormData({ email: "", role: "member" });
      onClose();
      if (onSuccess) onSuccess();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send invitation");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Invite Member
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="colleague@example.com"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  An invitation will be sent to this email address
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="member">
                    Member - Can create and edit tasks
                  </option>
                  <option value="admin">
                    Admin - Can manage members and settings
                  </option>
                  <option value="viewer">Viewer - Read-only access</option>
                </select>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>What happens next?</strong>
                  <br />
                  The invited user will receive an email with a link to join
                  this workspace. Theyll need to accept the invitation within 7
                  days.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
