/* eslint-disable @typescript-eslint/no-explicit-any */
// app/companies/[id]/departments/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/Layout/MainLayout";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import {
  UsersIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  UserPlusIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

interface UserBasic {
  id: number;
  username: string;
  email: string;
}

interface Department {
  id: number;
  company: number;
  name: string;
  description: string;
  manager?: number | null;
  manager_details?: UserBasic | null;
  members: number[];
  parent_department?: number | null;
  member_count: number;
  full_path: string;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: number;
  name: string;
  description?: string;
  logo?: string;
}

export default function DepartmentsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companyId = parseInt(params.id as string);

  const [company, setCompany] = useState<Company | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>(
    [],
  );
  const [allUsers, setAllUsers] = useState<UserBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  );
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    manager: "",
    parent_department: "",
  });

  const fetchCompany = async () => {
    try {
      const response = await api.get(`/companies/${companyId}/`);
      setCompany(response.data);
    } catch (err) {
      console.error("Failed to fetch company:", err);
      toast.error("Company not found");
      router.push("/companies");
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get(`/companies/${companyId}/departments/`);
      setDepartments(response.data);
      setFilteredDepartments(response.data);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users/");
      setAllUsers(response.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  useEffect(() => {
    fetchCompany();
    fetchDepartments();
    fetchUsers();
  }, [companyId]);

  useEffect(() => {
    let filtered = [...departments];
    if (searchInput) {
      const searchLower = searchInput.toLowerCase();
      filtered = filtered.filter(
        (dept) =>
          dept.name.toLowerCase().includes(searchLower) ||
          dept.description?.toLowerCase().includes(searchLower) ||
          dept.full_path.toLowerCase().includes(searchLower),
      );
    }
    setFilteredDepartments(filtered);
  }, [searchInput, departments]);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData: any = {
        name: formData.name,
        description: formData.description,
      };

      if (formData.manager) {
        submitData.manager = parseInt(formData.manager);
      }

      if (formData.parent_department) {
        submitData.parent_department = parseInt(formData.parent_department);
      }

      await api.post(`/companies/${companyId}/add_department/`, submitData);
      toast.success("Department created successfully!");
      setShowCreateModal(false);
      resetForm();
      fetchDepartments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create department");
    }
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepartment) return;
    try {
      const submitData: any = {
        name: formData.name,
        description: formData.description,
      };

      if (formData.manager) {
        submitData.manager = parseInt(formData.manager);
      }

      if (formData.parent_department) {
        submitData.parent_department = parseInt(formData.parent_department);
      }

      await api.patch(`/departments/${editingDepartment.id}/`, submitData);
      toast.success("Department updated successfully!");
      setEditingDepartment(null);
      resetForm();
      fetchDepartments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update department");
    }
  };

  const handleDeleteDepartment = async (id: number) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await api.delete(`/departments/${id}/`);
      toast.success("Department deleted successfully");
      fetchDepartments();
    } catch (err) {
      toast.error("Failed to delete department");
    }
  };

  const handleAddMember = async (departmentId: number, userId: number) => {
    try {
      await api.post(`/departments/${departmentId}/add_member/`, {
        user_id: userId,
      });
      toast.success("Member added successfully");
      fetchDepartments();
      if (selectedDepartment) {
        fetchDepartmentDetails(selectedDepartment.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add member");
    }
  };

  const handleRemoveMember = async (departmentId: number, userId: number) => {
    if (!confirm("Remove this member from the department?")) return;
    try {
      await api.delete(
        `/departments/${departmentId}/remove_member/?user_id=${userId}`,
      );
      toast.success("Member removed successfully");
      fetchDepartments();
      if (selectedDepartment) {
        fetchDepartmentDetails(selectedDepartment.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to remove member");
    }
  };

  const fetchDepartmentDetails = async (departmentId: number) => {
    try {
      const response = await api.get(`/departments/${departmentId}/`);
      setSelectedDepartment(response.data);
    } catch (err) {
      console.error("Failed to fetch department details:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      manager: "",
      parent_department: "",
    });
  };

  const openEditModal = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || "",
      manager: department.manager?.toString() || "",
      parent_department: department.parent_department?.toString() || "",
    });
  };

  const openMembersModal = async (department: Department) => {
    setSelectedDepartment(department);
    setShowMembersModal(true);
  };

  // Get available users (not already in department)
  const getAvailableUsers = () => {
    if (!selectedDepartment) return allUsers;
    return allUsers.filter(
      (user) => !selectedDepartment.members.includes(user.id),
    );
  };

  // Build department hierarchy
  const getDepartmentTree = () => {
    const departmentMap = new Map<number, Department>();
    const roots: Department[] = [];

    departments.forEach((dept) => {
      departmentMap.set(dept.id, { ...dept, children: [] } as any);
    });

    departments.forEach((dept) => {
      if (dept.parent_department) {
        const parent = departmentMap.get(dept.parent_department);
        if (parent) {
          (parent as any).children = (parent as any).children || [];
          (parent as any).children.push(departmentMap.get(dept.id));
        }
      } else {
        roots.push(departmentMap.get(dept.id)!);
      }
    });

    return roots;
  };

  const DepartmentCard = ({
    department,
    level = 0,
  }: {
    department: any;
    level?: number;
  }) => {
    const hasChildren = department.children && department.children.length > 0;

    return (
      <div className="relative">
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden"
          style={{ marginLeft: `${level * 20}px` }}
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {level > 0 && (
                    <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {department.name}
                  </h3>
                </div>
                {department.full_path &&
                  department.full_path !== department.name && (
                    <p className="text-xs text-gray-500 font-mono">
                      {department.full_path}
                    </p>
                  )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEditModal(department)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteDepartment(department.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {department.description && (
              <p className="text-gray-600 text-sm mb-4">
                {department.description}
              </p>
            )}

            <div className="flex items-center justify-between mb-3 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openMembersModal(department)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition"
                >
                  <UsersIcon className="w-4 h-4" />
                  <span>{department.member_count} members</span>
                </button>
              </div>
              {department.manager_details && (
                <div className="text-xs text-gray-500">
                  Manager: {department.manager_details.username}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                Created: {new Date(department.created_at).toLocaleDateString()}
              </div>
              {department.updated_at !== department.created_at && (
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  Updated:{" "}
                  {new Date(department.updated_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {hasChildren && (
          <div className="mt-3 space-y-3">
            {department.children.map((child: any) => (
              <DepartmentCard
                key={child.id}
                department={child}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const departmentTree = getDepartmentTree();

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/companies"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Companies
          </Link>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3">
                {company?.logo ? (
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="w-12 h-12 rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <BuildingOfficeIcon className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {company?.name} - Departments
                  </h1>
                  {company?.description && (
                    <p className="text-gray-600 mt-1">{company.description}</p>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <PlusIcon className="w-5 h-5" />
              Create Department
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search departments by name, description, or path..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Found{" "}
            <span className="font-semibold text-gray-900">
              {filteredDepartments.length}
            </span>{" "}
            departments
          </p>
        </div>

        {/* Departments Tree View */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <UsersIcon className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No departments found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Create your first department to organize your team.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-4 h-4" />
              Create Department
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {departmentTree.map((department) => (
              <DepartmentCard key={department.id} department={department} />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingDepartment) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowCreateModal(false);
                setEditingDepartment(null);
                resetForm();
              }}
            />

            <div className="relative bg-white rounded-lg max-w-md w-full">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingDepartment ? "Edit Department" : "Create Department"}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingDepartment(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form
                onSubmit={
                  editingDepartment
                    ? handleUpdateDepartment
                    : handleCreateDepartment
                }
                className="p-6 space-y-4"
              >
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
                    placeholder="e.g., Engineering, Sales, Marketing"
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
                    placeholder="Department description..."
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Department
                  </label>
                  <select
                    value={formData.parent_department}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        parent_department: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">None (Top Level)</option>
                    {departments
                      .filter(
                        (d) =>
                          !editingDepartment || d.id !== editingDepartment.id,
                      )
                      .map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.full_path || dept.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingDepartment(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingDepartment ? "Update" : "Create"} Department
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedDepartment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowMembersModal(false)}
            />

            <div className="relative bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedDepartment.name} - Members
                  </h3>
                  {selectedDepartment.full_path &&
                    selectedDepartment.full_path !==
                      selectedDepartment.name && (
                      <p className="text-sm text-gray-500">
                        {selectedDepartment.full_path}
                      </p>
                    )}
                </div>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                {/* Add Member Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Member
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      onChange={(e) => {
                        const userId = parseInt(e.target.value);
                        if (userId) {
                          handleAddMember(selectedDepartment.id, userId);
                          e.target.value = "";
                        }
                      }}
                      value=""
                    >
                      <option value="">Select a user to add</option>
                      {getAvailableUsers().map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.username} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Members List */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Current Members ({selectedDepartment.member_count})
                  </h4>
                  <div className="space-y-2">
                    {selectedDepartment.members.length === 0 ? (
                      <p className="text-gray-500 text-sm">No members yet</p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {allUsers
                          .filter((user) =>
                            selectedDepartment.members.includes(user.id),
                          )
                          .map((member) => (
                            <div
                              key={member.id}
                              className="py-3 flex justify-between items-center"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {member.username}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {member.email}
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  handleRemoveMember(
                                    selectedDepartment.id,
                                    member.id,
                                  )
                                }
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
