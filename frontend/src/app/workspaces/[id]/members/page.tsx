/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
// app/workspaces/[id]/members/page.tsx (Fixed)
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  UsersIcon,
  UserPlusIcon,
  UserMinusIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import MainLayout from "@/components/Layout/MainLayout";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/lib/api";

interface Member {
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
  invited_by_details: {
    id: number;
    username: string;
    email: string;
  };
}

export default function WorkspaceMembersPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = parseInt(params.id as string);

  const { currentWorkspace, fetchWorkspaceById } = useWorkspaceStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingRole, setUpdatingRole] = useState<number | null>(null);

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceDetails();
      fetchMembers();
    }
  }, [workspaceId]);

  const fetchWorkspaceDetails = async () => {
    try {
      await fetchWorkspaceById(workspaceId);
    } catch (error) {
      console.error("Failed to fetch workspace:", error);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/workspaces/${workspaceId}/members/`);
      const membersData = response.data;
      // Handle different response structures
      const membersList = Array.isArray(membersData)
        ? membersData
        : membersData.results || [];
      setMembers(membersList);
    } catch (error) {
      console.error("Failed to fetch members:", error);
      toast.error("Failed to load members");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      toast.error("Email is required");
      return;
    }

    setInviting(true);
    try {
      await api.post(`/workspaces/${workspaceId}/invite_member/`, {
        email: inviteEmail,
        role: inviteRole,
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole("member");
      fetchMembers();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.email?.[0] ||
        "Failed to send invitation";
      toast.error(errorMessage);
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (userId: number, newRole: string) => {
    setUpdatingRole(userId);
    try {
      await api.post(`/workspaces/${workspaceId}/update_member_role/`, {
        user_id: userId,
        role: newRole,
      });
      toast.success("Member role updated successfully");
      fetchMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update role");
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleRemoveMember = async (userId: number, username: string) => {
    if (
      !confirm(
        `Are you sure you want to remove ${username} from this workspace?`,
      )
    )
      return;

    try {
      await api.delete(
        `/workspaces/${workspaceId}/remove_member/?user_id=${userId}`,
      );
      toast.success(`${username} removed from workspace`);
      fetchMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove member");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "member":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <ShieldCheckIcon className="w-4 h-4" />;
      case "admin":
        return <ShieldCheckIcon className="w-4 h-4" />;
      default:
        return <UsersIcon className="w-4 h-4" />;
    }
  };

  // Safe filter function with null checks
  const filteredMembers = members.filter((member) => {
    if (!member.user_details) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      member.user_details.username?.toLowerCase().includes(searchLower) ||
      member.user_details.email?.toLowerCase().includes(searchLower) ||
      member.user_details.first_name?.toLowerCase().includes(searchLower) ||
      member.user_details.last_name?.toLowerCase().includes(searchLower)
    );
  });

  // Get current user ID from localStorage safely
  const getCurrentUserId = () => {
    try {
      const userId = localStorage.getItem("userId");
      return userId ? parseInt(userId) : 0;
    } catch {
      return 0;
    }
  };

  const isOwner = members.find(
    (m) => m.role === "owner" && m.user_details?.id === getCurrentUserId(),
  );

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

  // Helper function to get user initial safely
  const getUserInitial = (member: Member) => {
    if (!member.user_details) return "?";
    const firstName = member.user_details.first_name || "";
    const username = member.user_details.username || "";
    return (firstName.charAt(0) || username.charAt(0) || "?").toUpperCase();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/workspaces/${workspaceId}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Workspace
          </Link>

          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentWorkspace?.name || "Workspace"} - Members
              </h1>
              <p className="text-gray-600 mt-1">
                Manage team members and their roles in this workspace
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Link
              href={`/workspaces/${workspaceId}/add-user`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <UserPlusIcon className="w-5 h-5" />
              Create New User
            </Link>
            <Link
              href={`/workspaces/${workspaceId}/add-existing-user`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <UserPlusIcon className="w-5 h-5" />
              Add Existing User
            </Link>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <EnvelopeIcon className="w-5 h-5" />
              Invite by Email
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {members.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {members.filter((m) => m.role === "admin").length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <ShieldCheckIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {members.filter((m) => m.role === "member").length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserPlusIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search members by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invited By
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      {searchTerm
                        ? "No members match your search"
                        : "No members found"}
                    </td>
                  </tr>
                ) : (
                  filteredMembers
                    .map((member) => {
                      // Skip rendering if user_details is missing
                      if (!member.user_details) return null;

                      return (
                        <tr
                          key={member.id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                                  {getUserInitial(member)}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {getUserDisplayName(member)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  @{member.user_details.username}
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                  <EnvelopeIcon className="w-3 h-3" />
                                  {member.user_details.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}
                              >
                                {getRoleIcon(member.role)}
                                {member.role.charAt(0).toUpperCase() +
                                  member.role.slice(1)}
                              </span>
                              {member.role !== "owner" && isOwner && (
                                <select
                                  value={member.role}
                                  onChange={(e) =>
                                    handleUpdateRole(
                                      member.user_details.id,
                                      e.target.value,
                                    )
                                  }
                                  disabled={
                                    updatingRole === member.user_details.id
                                  }
                                  className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="member">Member</option>
                                  <option value="admin">Admin</option>
                                </select>
                              )}
                              {updatingRole === member.user_details.id && (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(member.joined_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {member.invited_by_details?.username || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {member.role !== "owner" && (
                              <button
                                onClick={() =>
                                  handleRemoveMember(
                                    member.user_details.id,
                                    member.user_details.username,
                                  )
                                }
                                className="text-red-600 hover:text-red-900 transition"
                                title="Remove Member"
                              >
                                <UserMinusIcon className="w-5 h-5" />
                              </button>
                            )}
                            {member.role === "owner" && (
                              <span className="text-gray-400 text-xs">
                                Owner cannot be removed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                    .filter(Boolean)
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowInviteModal(false)}
            />
            <div className="relative bg-white rounded-lg max-w-md w-full">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Invite Member to {currentWorkspace?.name}
                </h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleInviteMember} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="colleague@example.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    An invitation email will be sent to this address
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <div className="mt-2 text-xs text-gray-500">
                    <p>
                      <strong>Member:</strong> Can view and create tasks
                    </p>
                    <p>
                      <strong>Admin:</strong> Can manage members and workspace
                      settings
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {inviting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="w-4 h-4 inline mr-2" />
                        Send Invitation
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

// // app/workspaces/[id]/members/page.tsx
// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import { useWorkspaceStore } from "@/stores/workspaceStore";
// import {
//   User,
//   Mail,
//   Calendar,
//   Crown,
//   Shield,
//   MoreVertical,
//   X,
//   UserPlus,
//   ArrowLeft,
//   AlertCircle,
// } from "lucide-react";
// import { formatDistanceToNow } from "date-fns";
// import toast from "react-hot-toast";
// import { Member } from "@/types";
// import MainLayout from "@/components/Layout/MainLayout";

// export default function WorkspaceMembersPage() {
//   const { id } = useParams();
//   const router = useRouter();
//   const {
//     fetchWorkspaceMembers,
//     updateMemberRole,
//     removeMember,
//     fetchWorkspaceById,
//     currentWorkspace,
//     isLoading: storeLoading,
//   } = useWorkspaceStore();

//   const [members, setMembers] = useState<Member[]>([]);
//   const [actionMenu, setActionMenu] = useState<number | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         setLoading(true);
//         await fetchWorkspaceById(parseInt(id as string));
//         const data = await fetchWorkspaceMembers(parseInt(id as string));
//         setMembers(data);
//       } catch (err) {
//         setError(err instanceof Error ? err.message : "Failed to load members");
//         toast.error("Failed to load workspace members");
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (id) {
//       loadData();
//     }
//   }, [id, fetchWorkspaceMembers, fetchWorkspaceById]);

//   const getRoleIcon = (role: string) => {
//     switch (role) {
//       case "owner":
//         return <Crown className="h-4 w-4 text-yellow-600" />;
//       case "admin":
//         return <Shield className="h-4 w-4 text-blue-600" />;
//       default:
//         return <User className="h-4 w-4 text-gray-600" />;
//     }
//   };

//   const getRoleBadgeColor = (role: string) => {
//     switch (role) {
//       case "owner":
//         return "bg-yellow-100 text-yellow-800";
//       case "admin":
//         return "bg-blue-100 text-blue-800";
//       case "member":
//         return "bg-green-100 text-green-800";
//       case "viewer":
//         return "bg-gray-100 text-gray-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   const getRoleDisplayName = (role: string) => {
//     return role.charAt(0).toUpperCase() + role.slice(1);
//   };

//   const handleRoleChange = async (userId: number, newRole: string) => {
//     try {
//       await updateMemberRole(parseInt(id as string), userId, newRole);
//       setMembers(
//         members.map((m) => (m.user === userId ? { ...m, role: newRole } : m)),
//       );
//       toast.success(`Member role updated to ${getRoleDisplayName(newRole)}`);
//       setActionMenu(null);
//     } catch (error) {
//       toast.error("Failed to update member role");
//     }
//   };

//   const handleRemoveMember = async (userId: number) => {
//     if (
//       confirm("Are you sure you want to remove this member from the workspace?")
//     ) {
//       try {
//         await removeMember(parseInt(id as string), userId);
//         setMembers(members.filter((m) => m.user !== userId));
//         toast.success("Member removed successfully");
//         setActionMenu(null);
//       } catch (error) {
//         toast.error("Failed to remove member");
//       }
//     }
//   };

//   // Calculate stats
//   const ownerCount = members.filter((m) => m.role === "owner").length;
//   const adminCount = members.filter((m) => m.role === "admin").length;
//   const memberCount = members.filter((m) => m.role === "member").length;
//   const viewerCount = members.filter((m) => m.role === "viewer").length;

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading members...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="text-red-600 text-6xl mb-4">!</div>
//           <h2 className="text-2xl font-semibold text-gray-900 mb-2">
//             Failed to Load Members
//           </h2>
//           <p className="text-gray-600 mb-6">{error}</p>
//           <button
//             onClick={() => router.back()}
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
//           >
//             Go Back
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <MainLayout>
//       <div className="min-h-screen bg-gray-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           {/* Header */}
//           <div className="mb-8">
//             <Link
//               href={`/workspaces/${id}`}
//               className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition group"
//             >
//               <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition" />
//               <span className="text-sm">Back to Workspace</span>
//             </Link>

//             <div className="flex justify-between items-start">
//               <div>
//                 <h1 className="text-3xl font-bold text-gray-900">
//                   {currentWorkspace?.name || "Workspace"} Members
//                 </h1>
//                 <p className="text-gray-600 mt-2">
//                   Manage and collaborate with your team members
//                 </p>
//               </div>
//               <Link
//                 href={`/workspaces/${id}/invite`}
//                 className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
//               >
//                 <UserPlus className="h-5 w-5 mr-2" />
//                 Invite Member
//               </Link>
//             </div>
//           </div>

//           {/* Stats Cards */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
//             <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-gray-500">Owners</p>
//                   <p className="text-2xl font-bold text-gray-900">
//                     {ownerCount}
//                   </p>
//                 </div>
//                 <Crown className="h-8 w-8 text-yellow-500 opacity-50" />
//               </div>
//             </div>
//             <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-gray-500">Admins</p>
//                   <p className="text-2xl font-bold text-gray-900">
//                     {adminCount}
//                   </p>
//                 </div>
//                 <Shield className="h-8 w-8 text-blue-500 opacity-50" />
//               </div>
//             </div>
//             <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-gray-500">Members</p>
//                   <p className="text-2xl font-bold text-gray-900">
//                     {memberCount}
//                   </p>
//                 </div>
//                 <User className="h-8 w-8 text-green-500 opacity-50" />
//               </div>
//             </div>
//             <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-500">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-gray-500">Viewers</p>
//                   <p className="text-2xl font-bold text-gray-900">
//                     {viewerCount}
//                   </p>
//                 </div>
//                 <User className="h-8 w-8 text-gray-500 opacity-50" />
//               </div>
//             </div>
//           </div>

//           {/* Members List */}
//           <div className="bg-white rounded-lg shadow-sm overflow-hidden">
//             <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white">
//               <div className="flex justify-between items-center">
//                 <div>
//                   <h2 className="text-lg font-semibold text-gray-900">
//                     All Members
//                   </h2>
//                   <p className="text-sm text-gray-600 mt-1">
//                     {members.length} member{members.length !== 1 ? "s" : ""} in
//                     this workspace
//                   </p>
//                 </div>
//                 <div className="text-sm text-gray-500">
//                   <span className="hidden sm:inline">Total: </span>
//                   {members.length}
//                 </div>
//               </div>
//             </div>

//             {members.length === 0 ? (
//               <div className="p-12 text-center">
//                 <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//                 <h3 className="text-lg font-medium text-gray-900 mb-2">
//                   No members yet
//                 </h3>
//                 <p className="text-gray-600 mb-4">
//                   Invite members to start collaborating
//                 </p>
//                 <Link
//                   href={`/workspaces/${id}/invite`}
//                   className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
//                 >
//                   <UserPlus className="h-5 w-5 mr-2" />
//                   Invite Your First Member
//                 </Link>
//               </div>
//             ) : (
//               <div className="divide-y">
//                 {members.map((member) => (
//                   <div
//                     key={member.id}
//                     className="p-6 hover:bg-gray-50 transition"
//                   >
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-4 flex-1">
//                         {/* Avatar */}
//                         <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
//                           <span className="text-white font-medium text-lg">
//                             {(
//                               member.user_details.first_name?.[0] ||
//                               member.user_details.username?.[0] ||
//                               "U"
//                             ).toUpperCase()}
//                           </span>
//                         </div>

//                         {/* Member Info */}
//                         <div className="flex-1 min-w-0">
//                           <div className="flex flex-wrap items-center gap-2">
//                             <h3 className="font-medium text-gray-900 truncate">
//                               {member.user_details.first_name ||
//                                 member.user_details.username}
//                               {member.user_details.last_name &&
//                                 ` ${member.user_details.last_name}`}
//                             </h3>
//                             <span
//                               className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}
//                             >
//                               {getRoleIcon(member.role)}
//                               <span className="hidden sm:inline">
//                                 {getRoleDisplayName(member.role)}
//                               </span>
//                               <span className="sm:hidden">
//                                 {member.role.charAt(0).toUpperCase()}
//                               </span>
//                             </span>
//                           </div>

//                           <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
//                             <div className="flex items-center gap-1">
//                               <Mail className="h-3 w-3 flex-shrink-0" />
//                               <span className="truncate">
//                                 {member.user_details.email}
//                               </span>
//                             </div>
//                             <div className="flex items-center gap-1">
//                               <Calendar className="h-3 w-3 flex-shrink-0" />
//                               <span className="whitespace-nowrap">
//                                 Joined{" "}
//                                 {formatDistanceToNow(
//                                   new Date(member.joined_at),
//                                 )}{" "}
//                                 ago
//                               </span>
//                             </div>
//                           </div>

//                           {member.last_accessed && (
//                             <p className="text-xs text-gray-400 mt-1">
//                               Last active:{" "}
//                               {formatDistanceToNow(
//                                 new Date(member.last_accessed),
//                               )}{" "}
//                               ago
//                             </p>
//                           )}
//                         </div>
//                       </div>

//                       {/* Actions */}
//                       {member.role !== "owner" && (
//                         <div className="relative ml-4">
//                           <button
//                             onClick={() =>
//                               setActionMenu(
//                                 actionMenu === member.user ? null : member.user,
//                               )
//                             }
//                             className="p-2 hover:bg-gray-100 rounded-lg transition"
//                           >
//                             <MoreVertical className="h-5 w-5 text-gray-400" />
//                           </button>

//                           {actionMenu === member.user && (
//                             <>
//                               <div
//                                 className="fixed inset-0 z-10"
//                                 onClick={() => setActionMenu(null)}
//                               />
//                               <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border z-20 animate-in fade-in zoom-in duration-200">
//                                 <div className="p-2">
//                                   <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b mb-1">
//                                     Change Role
//                                   </div>
//                                   <button
//                                     onClick={() =>
//                                       handleRoleChange(member.user, "admin")
//                                     }
//                                     className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition flex items-center gap-2"
//                                   >
//                                     <Shield className="h-4 w-4 text-blue-600" />
//                                     Make Admin
//                                   </button>
//                                   <button
//                                     onClick={() =>
//                                       handleRoleChange(member.user, "member")
//                                     }
//                                     className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition flex items-center gap-2"
//                                   >
//                                     <User className="h-4 w-4 text-green-600" />
//                                     Make Member
//                                   </button>
//                                   <button
//                                     onClick={() =>
//                                       handleRoleChange(member.user, "viewer")
//                                     }
//                                     className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition flex items-center gap-2"
//                                   >
//                                     <User className="h-4 w-4 text-gray-600" />
//                                     Make Viewer
//                                   </button>
//                                   <div className="border-t my-1"></div>
//                                   <button
//                                     onClick={() =>
//                                       handleRemoveMember(member.user)
//                                     }
//                                     className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition flex items-center gap-2"
//                                   >
//                                     <X className="h-4 w-4" />
//                                     Remove Member
//                                   </button>
//                                 </div>
//                               </div>
//                             </>
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Info Box */}
//           {members.length > 0 && (
//             <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
//               <div className="flex items-start gap-3">
//                 <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
//                 <div>
//                   <p className="text-sm font-medium text-blue-900">
//                     About Member Roles
//                   </p>
//                   <p className="text-sm text-blue-800 mt-1">
//                     <strong>Owners</strong> have full control over the workspace
//                     including deletion. <strong>Admins</strong> can manage
//                     members and settings. <strong>Members</strong> can create
//                     and edit content. <strong>Viewers</strong> have read-only
//                     access.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </MainLayout>
//   );
// }
