/* eslint-disable react-hooks/immutability */
// app/workspaces/[id]/page.tsx - Workspace Detail (Fixed)
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { SettingsTab } from "@/components/SettingsTab";
import { Users, Settings, BarChart3, Plus, ArrowLeft } from "lucide-react";
import MainLayout from "@/components/Layout/MainLayout";
import { UserPlusIcon, UsersIcon } from "@heroicons/react/24/outline";
import api from "@/lib/api";

type TabType = "overview" | "settings";

interface Member {
  id: number;
  user: number;
  user_details?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  role: string;
  joined_at: string;
}

export default function WorkspaceDetail() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = parseInt(params.id as string);
  const { currentWorkspace, fetchWorkspaceById, updateWorkspace, isLoading } =
    useWorkspaceStore();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceById(workspaceId);
      fetchMembers();
    }
  }, [workspaceId, fetchWorkspaceById]);

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await api.get(`/workspaces/${workspaceId}/members/`);
      // Handle different response structures
      const membersData = response.data;
      if (Array.isArray(membersData)) {
        setMembers(membersData);
      } else if (membersData.results && Array.isArray(membersData.results)) {
        setMembers(membersData.results);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Helper function to get user display name safely
  const getUserDisplayName = (member: Member) => {
    if (!member.user_details) return "Unknown User";
    const firstName = member.user_details.first_name || "";
    const lastName = member.user_details.last_name || "";
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return member.user_details.username || "User";
  };

  // Helper function to get user initial
  const getUserInitial = (member: Member) => {
    if (!member.user_details) return "?";
    const firstName = member.user_details.first_name || "";
    const username = member.user_details.username || "";
    return (firstName.charAt(0) || username.charAt(0) || "?").toUpperCase();
  };

  if (isLoading || !currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "members", label: "Members", icon: Users, isPage: true },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Back Button */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>

            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentWorkspace.name}
                </h1>
                {currentWorkspace.description && (
                  <p className="text-gray-600 mt-1">
                    {currentWorkspace.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {currentWorkspace.plan} Plan
                  </span>
                  <span className="text-sm text-gray-500">
                    {currentWorkspace.member_count} members
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/workspaces/${workspaceId}/members`}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  <UsersIcon className="w-5 h-5" />
                  Members
                </Link>
                <Link
                  href={`/workspaces/${workspaceId}/add-user`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <UserPlusIcon className="w-5 h-5" />
                  Add User
                </Link>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-6 border-b border-gray-200">
              <nav className="flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;

                  if (tab.isPage) {
                    return (
                      <Link
                        key={tab.id}
                        href={`/workspaces/${workspaceId}/members`}
                        className="flex items-center gap-2 py-2 px-1 border-b-2 transition border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      >
                        <Icon className="h-5 w-5" />
                        {tab.label}
                      </Link>
                    );
                  } else {
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`
                        flex items-center gap-2 py-2 px-1 border-b-2 transition
                        ${
                          activeTab === tab.id
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }
                      `}
                      >
                        <Icon className="h-5 w-5" />
                        {tab.label}
                      </button>
                    );
                  }
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">
                    Total Tasks
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {currentWorkspace.task_count || 0}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">
                    Completed Tasks
                  </h3>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {currentWorkspace.completed_tasks || 0}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">
                    Active Members
                  </h3>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {currentWorkspace.member_count}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Link
                    href={`/workspaces/${workspaceId}/add-user`}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition group"
                  >
                    <div>
                      <p className="font-medium text-gray-900">Add User</p>
                      <p className="text-sm text-gray-500">
                        Create and add new user
                      </p>
                    </div>
                    <UserPlusIcon className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition" />
                  </Link>
                  <Link
                    href={`/workspaces/${workspaceId}/members`}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition group"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        Manage Members
                      </p>
                      <p className="text-sm text-gray-500">
                        View and manage all members
                      </p>
                    </div>
                    <Users className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition" />
                  </Link>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition group w-full text-left"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        Workspace Settings
                      </p>
                      <p className="text-sm text-gray-500">
                        Configure workspace preferences
                      </p>
                    </div>
                    <Settings className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition" />
                  </button>
                </div>
              </div>

              {/* Team Members Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Team Members
                  </h2>
                  <Link
                    href={`/workspaces/${workspaceId}/members`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    <UsersIcon className="w-4 h-4" />
                    Manage All Members
                  </Link>
                </div>

                {loadingMembers ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : !members || members.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No members found. Add your first team member!
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {members
                        .slice(0, 5)
                        .map((member) => {
                          // Skip rendering if user_details is missing
                          if (!member.user_details) return null;

                          return (
                            <div
                              key={member.id}
                              className="flex items-center gap-3"
                            >
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                {getUserInitial(member)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {getUserDisplayName(member)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  @{member.user_details.username || "unknown"} •{" "}
                                  {member.role || "member"}
                                </p>
                              </div>
                            </div>
                          );
                        })
                        .filter(Boolean)}
                    </div>
                    {members.length > 5 && (
                      <p className="text-xs text-gray-500 text-center mt-4">
                        +{members.length - 5} more members
                      </p>
                    )}
                  </>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link
                    href={`/workspaces/${workspaceId}/members`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    View all {members.length} members →
                  </Link>
                </div>
              </div>

              {/* Subscription Info */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-medium text-gray-900">
                    Subscription Details
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Current Plan</span>
                      <span className="font-medium capitalize">
                        {currentWorkspace.plan}
                      </span>
                    </div>
                    {currentWorkspace.days_until_expiry && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Days Until Expiry</span>
                        <span className="font-medium">
                          {currentWorkspace.days_until_expiry} days
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Member Limit</span>
                      <span className="font-medium">
                        {currentWorkspace.max_members || 10}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Storage Limit</span>
                      <span className="font-medium">
                        {currentWorkspace.max_storage_mb || 100} MB
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t">
                    <Link
                      href={`/workspaces/${currentWorkspace.id}/billing`}
                      className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                    >
                      Manage Subscription
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Workspace Settings
                </h2>
                <p className="text-gray-600 mt-1">
                  Manage your workspace preferences
                </p>
              </div>
              <SettingsTab
                workspace={currentWorkspace}
                onUpdate={updateWorkspace}
              />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
