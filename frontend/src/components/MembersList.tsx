// components/workspaces/MembersList.tsx
"use client";

import { useState, useEffect } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import {
  User,
  Mail,
  Calendar,
  Crown,
  Shield,
  MoreVertical,
  X,
  Check,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

interface MembersListProps {
  workspaceId: number;
  members: Array<{
    id: number;
    user: number;
    user_details: {
      id: number;
      username: string;
      email: string;
      first_name: string;
      last_name: string;
    };
    role: string;
    joined_at: string;
    last_accessed: string | null;
  }>;
}

export function MembersList({
  workspaceId,
  members: initialMembers,
}: MembersListProps) {
  const { updateMemberRole, removeMember, isLoading } = useWorkspaceStore();
  const [members, setMembers] = useState(initialMembers);
  const [actionMenu, setActionMenu] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMembers(initialMembers);
  }, [initialMembers]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "admin":
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-yellow-100 text-yellow-800";
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "member":
        return "bg-green-100 text-green-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateMemberRole(workspaceId, userId, newRole);
      setMembers(
        members.map((m) => (m.user === userId ? { ...m, role: newRole } : m)),
      );
      toast.success("Member role updated successfully");
      setActionMenu(null);
    } catch (error) {
      toast.error("Failed to update member role");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (
      confirm("Are you sure you want to remove this member from the workspace?")
    ) {
      try {
        await removeMember(workspaceId, userId);
        setMembers(members.filter((m) => m.user !== userId));
        toast.success("Member removed successfully");
        setActionMenu(null);
      } catch (error) {
        toast.error("Failed to remove member");
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">
          Workspace Members
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {members.length} member{members.length !== 1 ? "s" : ""} in this
          workspace
        </p>
      </div>

      <div className="divide-y">
        {members.map((member) => (
          <div key={member.id} className="p-6 hover:bg-gray-50 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {(
                      member.user_details.first_name?.[0] ||
                      member.user_details.username?.[0] ||
                      "U"
                    ).toUpperCase()}
                  </span>
                </div>

                {/* Member Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">
                      {member.user_details.first_name ||
                        member.user_details.username}
                      {member.user_details.last_name &&
                        ` ${member.user_details.last_name}`}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}
                    >
                      {getRoleIcon(member.role)}
                      {member.role.charAt(0).toUpperCase() +
                        member.role.slice(1)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>{member.user_details.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Joined {formatDistanceToNow(new Date(member.joined_at))}{" "}
                        ago
                      </span>
                    </div>
                  </div>

                  {member.last_accessed && (
                    <p className="text-xs text-gray-400 mt-1">
                      Last active:{" "}
                      {formatDistanceToNow(new Date(member.last_accessed))} ago
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              {member.role !== "owner" && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setActionMenu(
                        actionMenu === member.user ? null : member.user,
                      )
                    }
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <MoreVertical className="h-5 w-5 text-gray-400" />
                  </button>

                  {actionMenu === member.user && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
                          Change Role
                        </div>
                        <button
                          onClick={() => handleRoleChange(member.user, "admin")}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          <Shield className="h-4 w-4 inline mr-2" />
                          Make Admin
                        </button>
                        <button
                          onClick={() =>
                            handleRoleChange(member.user, "member")
                          }
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          <User className="h-4 w-4 inline mr-2" />
                          Make Member
                        </button>
                        <button
                          onClick={() =>
                            handleRoleChange(member.user, "viewer")
                          }
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          <User className="h-4 w-4 inline mr-2" />
                          Make Viewer
                        </button>
                        <div className="border-t my-1"></div>
                        <button
                          onClick={() => handleRemoveMember(member.user)}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="h-4 w-4 inline mr-2" />
                          Remove Member
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div className="p-12 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No members yet
          </h3>
          <p className="text-gray-600">Invite members to start collaborating</p>
        </div>
      )}
    </div>
  );
}
