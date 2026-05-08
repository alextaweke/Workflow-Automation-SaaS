/* eslint-disable @typescript-eslint/no-explicit-any */
// app/workspaces/[id]/invite/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import {
  X,
  Mail,
  Send,
  UserPlus,
  ArrowLeft,
  Users,
  Shield,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import MainLayout from "@/components/Layout/MainLayout";

export default function InviteMemberPage() {
  const { id } = useParams();
  const router = useRouter();
  const { inviteMember, fetchWorkspaceById, workspaces, isLoading } =
    useWorkspaceStore();
  const [formData, setFormData] = useState({
    email: "",
    role: "member",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id && typeof id === "string") {
      fetchWorkspaceById(parseInt(id));
    }
  }, [id, fetchWorkspaceById]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await inviteMember(parseInt(id as string), formData.email, formData.role);
      toast.success(`Invitation sent to ${formData.email}`);
      router.push(`/workspaces/${id}/members`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "admin":
        return "Full access to manage members, settings, and all workspace content";
      case "member":
        return "Can create, edit, and manage tasks and projects";
      case "viewer":
        return "Read-only access to view workspace content";
      default:
        return "";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-5 w-5" />;
      case "member":
        return <Users className="h-5 w-5" />;
      case "viewer":
        return <Eye className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workspace details...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with Back Button */}
          <div className="mb-8">
            <Link
              href={`/workspaces/${id}/members`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition" />
              <span className="text-sm">Back to Members</span>
            </Link>

            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Invite Member
                </h1>
                <p className="text-gray-600 mt-2">
                  {workspaces[0]?.name
                    ? `Invite people to join ${workspaces[0].name}`
                    : "Invite people to join your workspace"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <form onSubmit={handleSubmit}>
                  <div className="p-6 lg:p-8 space-y-6">
                    {/* Email Address */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="colleague@example.com"
                          autoFocus
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        An invitation will be sent to this email address
                      </p>
                    </div>

                    {/* Role Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Assign Role
                      </label>
                      <div className="space-y-3">
                        {[
                          { value: "admin", label: "Admin", color: "purple" },
                          { value: "member", label: "Member", color: "blue" },
                          { value: "viewer", label: "Viewer", color: "gray" },
                        ].map((roleOption) => (
                          <label
                            key={roleOption.value}
                            className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition ${
                              formData.role === roleOption.value
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-blue-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="role"
                              value={roleOption.value}
                              checked={formData.role === roleOption.value}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  role: e.target.value,
                                })
                              }
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 mt-1"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`p-1 rounded-lg bg-${roleOption.color}-100`}
                                >
                                  {getRoleIcon(roleOption.value)}
                                </div>
                                <span className="font-semibold text-gray-900">
                                  {roleOption.label}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {getRoleDescription(roleOption.value)}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Send className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-blue-900">
                            What happens next?
                          </p>
                          <p className="text-sm text-blue-800 mt-1">
                            The invited user will receive an email with a link
                            to join this workspace. Theyll need to accept the
                            invitation within 7 days. You can resend or cancel
                            pending invitations from the members list.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="px-6 lg:px-8 py-5 bg-gray-50 border-t flex flex-col sm:flex-row justify-end gap-3">
                    <Link
                      href={`/workspaces/${id}/members`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.email.trim()}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-lg hover:shadow-xl"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Invitation
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar - Info */}
            <div className="lg:col-span-1">
              {/* Role Comparison Card */}
              <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Role Permissions
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-gray-900">Admin</span>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1 ml-6">
                      <li>• Manage workspace settings</li>
                      <li>• Invite and remove members</li>
                      <li>• Change member roles</li>
                      <li>• Delete workspace</li>
                      <li>• Full access to all content</li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-gray-900">Member</span>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1 ml-6">
                      <li>• Create and edit tasks</li>
                      <li>• Create projects</li>
                      <li>• Comment and collaborate</li>
                      <li>• View all workspace content</li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">Viewer</span>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1 ml-6">
                      <li>• View tasks and projects</li>
                      <li>• Read comments</li>
                      <li>• Cannot create or edit</li>
                      <li>• Read-only access</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Tips Card */}
              <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                <h4 className="font-semibold text-gray-900 mb-2">💡 Pro Tip</h4>
                <p className="text-sm text-gray-700">
                  Start by inviting workspace admins who can help you manage the
                  team. You can always adjust roles and permissions later from
                  the Members settings.
                </p>
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-xs text-gray-600">
                    Workspace owners cant be removed or have their role changed.
                    Make sure to assign admin roles carefully.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
