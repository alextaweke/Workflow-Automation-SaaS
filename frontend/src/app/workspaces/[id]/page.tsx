// app/workspaces/[id]/page.tsx - Workspace Detail
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { MembersList } from "@/components/MembersList";
import { InviteMemberModal } from "@/components/InviteMemberModal";
import { SettingsTab } from "@/components/SettingsTab";
import { Users, Settings, BarChart3, Plus } from "lucide-react";
type TabType = "overview" | "members" | "settings";

export default function WorkspaceDetail() {
  const params = useParams();
  const { currentWorkspace, fetchWorkspaceById, updateWorkspace, isLoading } =
    useWorkspaceStore();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchWorkspaceById(params.id as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (isLoading || !currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "members", label: "Members", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
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
            {activeTab === "members" && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Invite Member
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
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
                  {currentWorkspace.total_tasks || 0}
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

            {/* Subscription Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Subscription Details
              </h3>
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
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <MembersList
            workspaceId={currentWorkspace.id}
            members={currentWorkspace.memberships || []}
          />
        )}

        {activeTab === "settings" && (
          <SettingsTab
            workspace={currentWorkspace}
            onUpdate={updateWorkspace}
          />
        )}
      </div>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        workspaceId={currentWorkspace.id}
      />
    </div>
  );
}
