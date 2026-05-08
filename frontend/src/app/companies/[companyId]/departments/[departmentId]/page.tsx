/* eslint-disable @typescript-eslint/no-explicit-any */
// app/companies/[companyId]/departments/[departmentId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import MainLayout from "@/components/Layout/MainLayout";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import {
  ArrowLeftIcon,
  UsersIcon,
  UserPlusIcon,
  UserMinusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface Department {
  id: number;
  company: number;
  name: string;
  description: string;
  manager?: number | null;
  manager_details?: {
    id: number;
    username: string;
    email: string;
  } | null;
  members: number[];
  parent_department?: number | null;
  parent_department_details?: {
    id: number;
    name: string;
    full_path: string;
  } | null;
  member_count: number;
  full_path: string;
  created_at: string;
  updated_at: string;
}

export default function DepartmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = parseInt(params.companyId as string);
  const departmentId = parseInt(params.departmentId as string);

  const [department, setDepartment] = useState<Department | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    manager: "",
    parent_department: "",
  });

  const fetchDepartment = async () => {
    try {
      console.log("Fetching department:", departmentId);
      const response = await api.get(`/departments/${departmentId}/`);
      console.log("Department response:", response.data);
      setDepartment(response.data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch department:", err);
      console.error("Error response:", err.response);
      setError(err.response?.data?.message || "Department not found");
      toast.error("Department not found");
      // Don't redirect immediately, show error message first
    }
  };

  const fetchMembers = async () => {
    try {
      console.log("Fetching members for department:", departmentId);
      const response = await api.get(`/departments/${departmentId}/members/`);
      console.log("Members response:", response.data);
      const membersData = Array.isArray(response.data) ? response.data : [];
      setMembers(membersData);
    } catch (err) {
      console.error("Failed to fetch members:", err);
      setMembers([]);
    }
  };

  const fetchAllUsers = async () => {
    try {
      console.log("Fetching all users");
      // Try multiple endpoints
      let usersData: User[] = [];

      try {
        const response = await api.get("/auth/users/");
        if (Array.isArray(response.data)) {
          usersData = response.data;
        } else if (
          response.data.results &&
          Array.isArray(response.data.results)
        ) {
          usersData = response.data.results;
        }
      } catch (err) {
        console.log("Auth users endpoint failed, trying /users/");
        try {
          const response = await api.get("/users/");
          if (Array.isArray(response.data)) {
            usersData = response.data;
          } else if (
            response.data.results &&
            Array.isArray(response.data.results)
          ) {
            usersData = response.data.results;
          }
        } catch (err2) {
          console.log("Users endpoint failed, trying /api/users/");
          try {
            const response = await api.get("/api/users/");
            if (Array.isArray(response.data)) {
              usersData = response.data;
            } else if (
              response.data.results &&
              Array.isArray(response.data.results)
            ) {
              usersData = response.data.results;
            }
          } catch (err3) {
            console.log(
              "All user endpoints failed, using mock data or current user only",
            );
            // Fallback: try to get current user
            try {
              const currentUser = await api.get("/auth/users/me/");
              if (currentUser.data) {
                usersData = [currentUser.data];
              }
            } catch (err4) {
              console.error("Could not fetch any user data");
            }
          }
        }
      }

      console.log("All users fetched:", usersData.length);
      setAllUsers(usersData);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setAllUsers([]);
    }
  };

  useEffect(() => {
    if (departmentId && !isNaN(departmentId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      Promise.all([fetchDepartment(), fetchMembers(), fetchAllUsers()]).finally(
        () => {
          setLoading(false);
        },
      );
    } else {
      setLoading(false);
      setError("Invalid department ID");
    }
  }, [departmentId]);

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department) return;
    try {
      const submitData: any = {
        name: formData.name,
        description: formData.description,
      };

      if (formData.manager && formData.manager !== "") {
        submitData.manager = parseInt(formData.manager);
      } else {
        submitData.manager = null;
      }

      if (formData.parent_department && formData.parent_department !== "") {
        submitData.parent_department = parseInt(formData.parent_department);
      } else {
        submitData.parent_department = null;
      }

      await api.patch(`/departments/${departmentId}/`, submitData);
      toast.success("Department updated successfully!");
      setShowEditModal(false);
      fetchDepartment();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update department");
    }
  };

  const handleDeleteDepartment = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this department? This will also remove all members.",
      )
    )
      return;
    try {
      await api.delete(`/departments/${departmentId}/`);
      toast.success("Department deleted successfully");
      router.push(`/companies/${companyId}/departments`);
    } catch (err) {
      toast.error("Failed to delete department");
    }
  };

  const handleAddMember = async (userId: number) => {
    try {
      await api.post(`/departments/${departmentId}/add_member/`, {
        user_id: userId,
      });
      toast.success("Member added successfully");
      fetchMembers();
      fetchDepartment(); // Refresh department to update member count
      setShowAddMemberModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add member");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm("Remove this member from the department?")) return;
    try {
      await api.delete(
        `/departments/${departmentId}/remove_member/?user_id=${userId}`,
      );
      toast.success("Member removed successfully");
      fetchMembers();
      fetchDepartment(); // Refresh department to update member count
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to remove member");
    }
  };

  const openEditModal = () => {
    if (department) {
      setFormData({
        name: department.name,
        description: department.description || "",
        manager: department.manager?.toString() || "",
        parent_department: department.parent_department?.toString() || "",
      });
      setShowEditModal(true);
    }
  };

  const getAvailableUsers = () => {
    const memberIds = new Set(members.map((m) => m.id));
    return allUsers.filter((user) => !memberIds.has(user.id));
  };

  // Show loading state
  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-500">Loading department details...</p>
        </div>
      </MainLayout>
    );
  }

  // Show error state
  if (error || !department) {
    return (
      <MainLayout>
        <div className="text-center py-16">
          <div className="bg-red-50 rounded-lg p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">
              {error || "Department not found"}
            </p>
            <Link
              href={`/companies/${companyId}/departments`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Departments
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/companies/${companyId}/departments`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Departments
          </Link>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {department.full_path}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {department.name}
                  </h1>
                  {department.description && (
                    <p className="text-gray-600 mt-2">
                      {department.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={openEditModal}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDeleteDepartment}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                {department.manager_details && (
                  <div>
                    <p className="text-sm text-gray-500">Department Manager</p>
                    <div className="flex items-center gap-2 mt-1">
                      <UsersIcon className="w-4 h-4 text-gray-400" />
                      <p className="font-medium text-gray-900">
                        {department.manager_details.username}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {department.manager_details.email}
                    </p>
                  </div>
                )}
                {department.parent_department_details && (
                  <div>
                    <p className="text-sm text-gray-500">Parent Department</p>
                    <Link
                      href={`/companies/${companyId}/departments/${department.parent_department}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {department.parent_department_details.name}
                    </Link>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-sm text-gray-900">
                    {new Date(department.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">
                Members ({members.length})
              </h2>
            </div>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <UserPlusIcon className="w-4 h-4" />
              Add Member
            </button>
          </div>

          <div className="p-6">
            {members.length === 0 ? (
              <div className="text-center py-8">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-gray-500">
                  No members in this department yet
                </p>
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="mt-3 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Add your first member
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{member.username}
                          </p>
                        </div>
                      </div>
                      <div className="ml-10 mt-1">
                        <div className="flex items-center gap-2">
                          <EnvelopeIcon className="w-3 h-3 text-gray-400" />
                          <p className="text-xs text-gray-500">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="Remove member"
                    >
                      <UserMinusIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowEditModal(false)}
            />
            <div className="relative bg-white rounded-lg max-w-md w-full">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Edit Department
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleUpdateDepartment} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manager
                  </label>
                  <select
                    value={formData.manager}
                    onChange={(e) =>
                      setFormData({ ...formData, manager: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select manager</option>
                    {allUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowAddMemberModal(false)}
            />
            <div className="relative bg-white rounded-lg max-w-md w-full">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Add Member
                </h3>
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {getAvailableUsers().length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      No available users to add
                    </p>
                  ) : (
                    getAvailableUsers().map((user) => (
                      <div
                        key={user.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.username}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <button
                          onClick={() => handleAddMember(user.id)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          Add
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
