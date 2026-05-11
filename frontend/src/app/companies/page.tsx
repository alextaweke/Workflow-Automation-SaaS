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
  XMarkIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

// ==================== Types ====================
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

// ==================== Custom Hooks ====================
const useCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = async (workspaceId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params = workspaceId ? { workspace_id: workspaceId } : {};
      const response = await api.get<Company[]>("/companies/", { params });
      setCompanies(response.data);
    } catch (err) {
      setError("Failed to load companies");
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const deleteCompany = async (id: number) => {
    try {
      await api.delete(`/companies/${id}/`);
      toast.success("Company deleted successfully");
      return true;
    } catch (err) {
      toast.error("Failed to delete company");
      return false;
    }
  };

  return {
    companies,
    setCompanies,
    loading,
    error,
    fetchCompanies,
    deleteCompany,
  };
};

const useWorkspaces = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = async () => {
    try {
      const response = await api.get("/workspaces/");
      const workspacesData = response.data.results || response.data;
      setWorkspaces(workspacesData);
    } catch (err) {
      console.error("Failed to fetch workspaces:", err);
    } finally {
      setLoading(false);
    }
  };

  return { workspaces, loading, fetchWorkspaces };
};

// ==================== Components ====================

// Header Component
const PageHeader = () => (
  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold mb-2">Companies</h1>
        <p className="text-blue-100">
          Manage and organize all your business entities in one place
        </p>
      </div>
      <Link
        href="/companies/create"
        className="group inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-200"
      >
        <PlusIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
        Create Company
      </Link>
    </div>
  </div>
);

// Search and Filter Bar
const SearchFilterBar = ({
  searchInput,
  onSearchChange,
  selectedWorkspace,
  onWorkspaceChange,
  workspaces,
  onClearFilters,
}: {
  searchInput: string;
  onSearchChange: (value: string) => void;
  selectedWorkspace: string;
  onWorkspaceChange: (value: string) => void;
  workspaces: Workspace[];
  onClearFilters: () => void;
}) => {
  const hasActiveFilters = searchInput || selectedWorkspace;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative group">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search companies by name or description..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="relative group">
          <BriefcaseIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <select
            value={selectedWorkspace}
            onChange={(e) => onWorkspaceChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer transition-all"
          >
            <option value="">All Workspaces</option>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name} • {workspace.plan}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
          >
            <XMarkIcon className="w-5 h-5" />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

// Stats Summary
const StatsSummary = ({
  count,
  workspaceName,
}: {
  count: number;
  workspaceName?: string;
}) => (
  <div className="mb-6 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
        {count} {count === 1 ? "Company" : "Companies"}
      </div>
      {workspaceName && (
        <>
          <span className="text-gray-400">in</span>
          <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            {workspaceName}
          </div>
        </>
      )}
    </div>
  </div>
);

// Loading Skeleton
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div>
              <div className="h-5 w-32 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="flex gap-1">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-3/4 bg-gray-200 rounded mb-4"></div>
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    ))}
  </div>
);

// Empty State
const EmptyState = () => (
  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border border-gray-200">
    <div className="inline-flex p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4">
      <BuildingOfficeIcon className="h-8 w-8 text-white" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">
      No companies found
    </h3>
    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
      Get started by creating your first company and start managing your
      business structure.
    </p>
    <Link
      href="/companies/create"
      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
    >
      <PlusIcon className="w-5 h-5" />
      Create Your First Company
    </Link>
  </div>
);

// Company Card Component
const CompanyCard = ({
  company,
  onEdit,
  onDelete,
}: {
  company: Company;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      confirm(
        "Are you sure you want to delete this company? This action cannot be undone.",
      )
    ) {
      setIsDeleting(true);
      await onDelete(company.id);
      setIsDeleting(false);
    }
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="relative">
        {/* Gradient bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <BuildingOfficeIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {company.name}
                </h3>
                {company.legal_name && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {company.legal_name}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => onEdit(company.id)}
                className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
                title="Edit company"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50"
                title="Delete company"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Description */}
          {company.description && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-4 leading-relaxed">
              {company.description}
            </p>
          )}

          {/* Workspace Badge */}
          {company.workspace_details && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-lg text-xs font-medium border border-indigo-100">
                <BriefcaseIcon className="w-3.5 h-3.5" />
                {company.workspace_details.name}
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mb-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <UsersIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {company.member_count} member{company.member_count !== 1 && "s"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {company.department_count} department
                {company.department_count !== 1 && "s"}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {company.is_verified && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
            {company.company_type && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                {company.company_type}
              </span>
            )}
            {company.industry && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                {company.industry}
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <CalendarIcon className="w-3.5 h-3.5" />
              {new Date(company.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
            <Link
              href={`/companies/${company.id}`}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1.5 group/link"
            >
              View Details
              <EyeIcon className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Companies Grid
const CompaniesGrid = ({
  companies,
  onEdit,
  onDelete,
}: {
  companies: Company[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {companies.map((company) => (
      <CompanyCard
        key={company.id}
        company={company}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ))}
  </div>
);

// ==================== Main Page Component ====================
export default function CompaniesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);

  const { companies, loading, fetchCompanies, deleteCompany } = useCompanies();
  const { workspaces } = useWorkspaces();

  // Filter companies based on search input
  useEffect(() => {
    let filtered = [...companies];
    if (searchInput) {
      const searchLower = searchInput.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(searchLower) ||
          company.description?.toLowerCase().includes(searchLower) ||
          company.legal_name?.toLowerCase().includes(searchLower) ||
          company.industry?.toLowerCase().includes(searchLower),
      );
    }
    setFilteredCompanies(filtered);
  }, [searchInput, companies]);

  // Fetch data on mount and workspace change
  useEffect(() => {
    fetchCompanies(selectedWorkspace);
  }, [selectedWorkspace]);

  const handleDeleteCompany = async (id: number) => {
    const success = await deleteCompany(id);
    if (success) {
      fetchCompanies(selectedWorkspace);
    }
  };

  const handleEditCompany = (id: number) => {
    router.push(`/companies/${id}/edit`);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSelectedWorkspace("");
  };

  const currentWorkspace = workspaces.find(
    (w) => w.id.toString() === selectedWorkspace,
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader />

        <SearchFilterBar
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          selectedWorkspace={selectedWorkspace}
          onWorkspaceChange={setSelectedWorkspace}
          workspaces={workspaces}
          onClearFilters={clearFilters}
        />

        {!loading && filteredCompanies.length > 0 && (
          <StatsSummary
            count={filteredCompanies.length}
            workspaceName={currentWorkspace?.name}
          />
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : filteredCompanies.length === 0 ? (
          <EmptyState />
        ) : (
          <CompaniesGrid
            companies={filteredCompanies}
            onEdit={handleEditCompany}
            onDelete={handleDeleteCompany}
          />
        )}
      </div>
    </MainLayout>
  );
}
