/* eslint-disable @typescript-eslint/no-explicit-any */
// app/companies/[companyId]/departments/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  CalendarIcon,
  BuildingOfficeIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface UserBasic {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
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
  const companyId = parseInt(params.companyId as string);

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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      const departmentsData = Array.isArray(response.data) ? response.data : [];
      setDepartments(departmentsData);
      setFilteredDepartments(departmentsData);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Try the auth users endpoint (common pattern)
      let usersData: UserBasic[] = [];

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
        console.log("Auth users endpoint failed, trying alternative...");

        // Try alternative endpoints
        try {
          const response = await api.get("/accounts/users/");
          if (Array.isArray(response.data)) {
            usersData = response.data;
          } else if (
            response.data.results &&
            Array.isArray(response.data.results)
          ) {
            usersData = response.data.results;
          }
        } catch (err2) {
          // Try workspace members endpoint or just use current user
          console.log("Users endpoint failed, using current user only");

          // Use the current user as a fallback
          const currentUserResponse = await api.get("/auth/users/me/");
          if (currentUserResponse.data) {
            usersData = [currentUserResponse.data];
          }
        }
      }

      setAllUsers(usersData);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setAllUsers([]);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchCompany();
      fetchDepartments();
      fetchUsers();
    }
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

    if (!formData.name.trim()) {
      toast.error("Department name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData: any = {
        name: formData.name.trim(),
        description: formData.description || "",
      };

      if (formData.manager && formData.manager !== "") {
        submitData.manager = parseInt(formData.manager);
      }

      if (formData.parent_department && formData.parent_department !== "") {
        submitData.parent_department = parseInt(formData.parent_department);
      }

      const response = await api.post(
        `/companies/${companyId}/add_department/`,
        submitData,
      );

      if (response.data) {
        toast.success("Department created successfully!");
        setShowCreateModal(false);
        resetForm();
        await fetchDepartments();
      }
    } catch (err: any) {
      console.error("Create department error:", err);

      let errorMessage = "Failed to create department";
      if (err.response?.data) {
        if (typeof err.response.data === "object") {
          const errors = err.response.data;
          if (errors.name)
            errorMessage = Array.isArray(errors.name)
              ? errors.name[0]
              : errors.name;
          else if (errors.error) errorMessage = errors.error;
          else if (errors.message) errorMessage = errors.message;
          else errorMessage = JSON.stringify(errors);
        } else if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepartment) return;

    setIsSubmitting(true);

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

      await api.patch(`/departments/${editingDepartment.id}/`, submitData);
      toast.success("Department updated successfully!");
      setEditingDepartment(null);
      resetForm();
      await fetchDepartments();
    } catch (err: any) {
      console.error("Update department error:", err);
      toast.error(err.response?.data?.message || "Failed to update department");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (id: number) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await api.delete(`/departments/${id}/`);
      toast.success("Department deleted successfully");
      await fetchDepartments();
    } catch (err) {
      toast.error("Failed to delete department");
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

  // Build department tree
  const getDepartmentTree = () => {
    const departmentMap = new Map<number, any>();
    const roots: any[] = [];

    departments.forEach((dept) => {
      departmentMap.set(dept.id, { ...dept, children: [] });
    });

    departments.forEach((dept) => {
      if (dept.parent_department && departmentMap.has(dept.parent_department)) {
        const parent = departmentMap.get(dept.parent_department);
        if (parent) {
          parent.children.push(departmentMap.get(dept.id));
        }
      } else if (!dept.parent_department) {
        roots.push(departmentMap.get(dept.id));
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
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {department.description}
              </p>
            )}

            <div className="flex items-center justify-between mb-3 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <Link
                  href={`/companies/${companyId}/departments/${department.id}`}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition"
                >
                  <UsersIcon className="w-4 h-4" />
                  <span>{department.member_count} members</span>
                </Link>
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
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
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
        {filteredDepartments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <UsersIcon className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No departments found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Create your first department to organize your team.
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
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
                        {user.first_name || user.username} ({user.email})
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
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting
                      ? "Saving..."
                      : editingDepartment
                        ? "Update"
                        : "Create"}
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
