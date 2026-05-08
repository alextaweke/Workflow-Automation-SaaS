/* eslint-disable react-hooks/set-state-in-effect */
// app/companies/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/Layout/MainLayout";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import {
  BuildingOfficeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  CalendarIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";

interface Workspace {
  id: number;
  name: string;
  description?: string;
  plan: string;
}

interface Company {
  id: number;
  name: string;
  legal_name?: string;
  description?: string;
  company_type?: string;
  industry?: string;
  email?: string;
  phone?: string;
  website?: string;
  logo?: string;
  department_count: number;
  member_count: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  workspace?: number;
  workspace_details?: {
    id: number;
    name: string;
    plan: string;
  };
  owner_details: {
    id: number;
    username: string;
    email: string;
  };
}

export default function CompaniesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");

  const fetchWorkspaces = async () => {
    try {
      const response = await api.get("/workspaces/");
      const workspacesData = response.data.results || response.data;
      setWorkspaces(workspacesData);
    } catch (err) {
      console.error("Failed to fetch workspaces:", err);
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const params = selectedWorkspace
        ? { workspace_id: selectedWorkspace }
        : {};
      const response = await api.get<Company[]>("/companies/", { params });
      setCompanies(response.data);
      setFilteredCompanies(response.data);
    } catch (err) {
      console.error("Failed to fetch companies:", err);
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [selectedWorkspace]);

  useEffect(() => {
    let filtered = [...companies];
    if (searchInput) {
      const searchLower = searchInput.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(searchLower) ||
          company.description?.toLowerCase().includes(searchLower) ||
          company.legal_name?.toLowerCase().includes(searchLower),
      );
    }
    setFilteredCompanies(filtered);
  }, [searchInput, companies]);

  const handleDeleteCompany = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this company? This will also delete all departments.",
      )
    )
      return;
    try {
      await api.delete(`/companies/${id}/`);
      toast.success("Company deleted successfully");
      fetchCompanies();
    } catch (err) {
      toast.error("Failed to delete company");
    }
  };

  const handleEditCompany = (id: number) => {
    router.push(`/companies/${id}/edit`);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
            <p className="text-gray-600 mt-2">
              Manage your companies and organizations
            </p>
          </div>
          <Link
            href="/companies/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <PlusIcon className="w-5 h-5" />
            Create Company
          </Link>
        </div>

        {/* Workspace Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies by name or description..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <BriefcaseIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedWorkspace}
                onChange={(e) => setSelectedWorkspace(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">All Workspaces</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name} ({workspace.plan})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Found{" "}
            <span className="font-semibold text-gray-900">
              {filteredCompanies.length}
            </span>{" "}
            companies
            {selectedWorkspace &&
              workspaces.find((w) => w.id.toString() === selectedWorkspace) && (
                <span className="text-gray-500">
                  {" "}
                  in workspace
                  {
                    workspaces.find(
                      (w) => w.id.toString() === selectedWorkspace,
                    )?.name
                  }
                </span>
              )}
          </p>
        </div>

        {/* Companies Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <BuildingOfficeIcon className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No companies found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by creating your first company.
            </p>
            <Link
              href="/companies/create"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-4 h-4" />
              Create Company
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <BuildingOfficeIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {company.name}
                        </h3>
                        {company.legal_name && (
                          <p className="text-xs text-gray-500">
                            {company.legal_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditCompany(company.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(company.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {company.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                      {company.description}
                    </p>
                  )}

                  {/* Workspace Badge */}
                  {company.workspace_details && (
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs">
                        <BriefcaseIcon className="w-3 h-3" />
                        {company.workspace_details.name}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-4 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <UsersIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {company.member_count} members
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {company.department_count} departments
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {company.is_verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">
                        <CheckCircleIcon className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                    {company.company_type && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                        {company.company_type}
                      </span>
                    )}
                    {company.industry && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                        {company.industry}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <CalendarIcon className="w-3 h-3" />
                      Created{" "}
                      {new Date(company.created_at).toLocaleDateString()}
                    </div>
                    <Link
                      href={`/companies/${company.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    >
                      View Details
                      <EyeIcon className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
