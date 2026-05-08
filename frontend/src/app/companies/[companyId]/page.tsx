/* eslint-disable @typescript-eslint/no-explicit-any */
// app/companies/[companyId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import MainLayout from "@/components/Layout/MainLayout";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  UsersIcon,
  CalendarIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BriefcaseIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";

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
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  full_address?: string;
  tax_id?: string;
  registration_number?: string;
  primary_color?: string;
  department_count: number;
  member_count: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  verified_at?: string;
  owner_details: {
    id: number;
    username: string;
    email: string;
  };
}

interface Department {
  id: number;
  name: string;
  description: string;
  member_count: number;
  full_path: string;
}

export default function CompanyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = parseInt(params.companyId as string);

  const [company, setCompany] = useState<Company | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    legal_name: "",
    description: "",
    company_type: "",
    industry: "",
    email: "",
    phone: "",
    website: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    tax_id: "",
    registration_number: "",
  });

  const companyTypes = [
    "Corporation",
    "LLC",
    "Partnership",
    "Sole Proprietorship",
    "Non-Profit",
    "Government",
  ];

  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "Manufacturing",
    "Retail",
    "Construction",
    "Real Estate",
    "Transportation",
    "Media",
    "Energy",
    "Agriculture",
  ];

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/companies/${companyId}/`);
      setCompany(response.data);
    } catch (err) {
      console.error("Failed to fetch company:", err);
      toast.error("Company not found");
      router.push("/companies");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get(`/companies/${companyId}/departments/`);
      setDepartments(response.data);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  };

  useEffect(() => {
    if (companyId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCompanyDetails();
      fetchDepartments();
    }
  }, [companyId]);

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/companies/${companyId}/`, formData);
      toast.success("Company updated successfully!");
      setShowEditModal(false);
      fetchCompanyDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update company");
    }
  };

  const handleDeleteCompany = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this company? This action cannot be undone.",
      )
    )
      return;
    try {
      await api.delete(`/companies/${companyId}/`);
      toast.success("Company deleted successfully");
      router.push("/companies");
    } catch (err) {
      toast.error("Failed to delete company");
    }
  };

  const openEditModal = () => {
    if (company) {
      setFormData({
        name: company.name,
        legal_name: company.legal_name || "",
        description: company.description || "",
        company_type: company.company_type || "",
        industry: company.industry || "",
        email: company.email || "",
        phone: company.phone || "",
        website: company.website || "",
        address_line1: company.address_line1 || "",
        address_line2: company.address_line2 || "",
        city: company.city || "",
        state: company.state || "",
        postal_code: company.postal_code || "",
        country: company.country || "",
        tax_id: company.tax_id || "",
        registration_number: company.registration_number || "",
      });
      setShowEditModal(true);
    }
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

  if (!company) {
    return (
      <MainLayout>
        <div className="text-center py-16">
          <BuildingOfficeIcon className="mx-auto h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Company not found
          </h2>
          <Link href="/companies" className="text-blue-600 mt-4 inline-block">
            Back to Companies
          </Link>
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Cover Image / Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  {company.logo ? (
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-20 h-20 rounded-xl border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-lg">
                      <BuildingOfficeIcon className="w-10 h-10 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-1">
                      {company.name}
                    </h1>
                    {company.legal_name && (
                      <p className="text-blue-100 text-sm">
                        {company.legal_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={openEditModal}
                    className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition flex items-center gap-2"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteCompany}
                    className="px-4 py-2 bg-red-500/20 text-red-100 rounded-lg hover:bg-red-500/30 transition flex items-center gap-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Company Stats */}
            <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <UsersIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Members</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {company.member_count}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <BriefcaseIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Departments</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {company.department_count}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(company.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  {company.is_verified ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <StarSolidIcon className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-sm font-medium text-gray-900">
                    {company.is_verified ? "Verified" : "Pending Verification"}
                  </p>
                </div>
              </div>
            </div>

            {/* Company Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Company Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Description */}
                  {company.description && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                        About
                      </h2>
                      <p className="text-gray-600 leading-relaxed">
                        {company.description}
                      </p>
                    </div>
                  )}

                  {/* Business Information */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <BriefcaseIcon className="w-5 h-5 text-gray-400" />
                      Business Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {company.company_type && (
                        <div>
                          <p className="text-sm text-gray-500">Company Type</p>
                          <p className="text-gray-900">
                            {company.company_type}
                          </p>
                        </div>
                      )}
                      {company.industry && (
                        <div>
                          <p className="text-sm text-gray-500">Industry</p>
                          <p className="text-gray-900">{company.industry}</p>
                        </div>
                      )}
                      {company.tax_id && (
                        <div>
                          <p className="text-sm text-gray-500">Tax ID</p>
                          <p className="text-gray-900">{company.tax_id}</p>
                        </div>
                      )}
                      {company.registration_number && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Registration Number
                          </p>
                          <p className="text-gray-900">
                            {company.registration_number}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                      Contact Information
                    </h2>
                    <div className="space-y-2">
                      {company.email && (
                        <div className="flex items-center gap-2">
                          <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                          <a
                            href={`mailto:${company.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {company.email}
                          </a>
                        </div>
                      )}
                      {company.phone && (
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="w-4 h-4 text-gray-400" />
                          <a
                            href={`tel:${company.phone}`}
                            className="text-gray-900"
                          >
                            {company.phone}
                          </a>
                        </div>
                      )}
                      {company.website && (
                        <div className="flex items-center gap-2">
                          <GlobeAltIcon className="w-4 h-4 text-gray-400" />
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {company.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  {company.full_address && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MapPinIcon className="w-5 h-5 text-gray-400" />
                        Address
                      </h2>
                      <p className="text-gray-600">{company.full_address}</p>
                    </div>
                  )}
                </div>

                {/* Right Column - Departments & Owner */}
                <div className="space-y-6">
                  {/* Departments */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <BriefcaseIcon className="w-5 h-5 text-gray-400" />
                        Departments
                      </h2>
                      <Link
                        href={`/companies/${companyId}/departments`}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        View All
                      </Link>
                    </div>
                    {departments.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        No departments yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {departments.slice(0, 5).map((dept) => (
                          <Link
                            key={dept.id}
                            href={`/companies/${companyId}/departments/${dept.id}`}
                            className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                          >
                            <p className="font-medium text-gray-900">
                              {dept.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <UsersIcon className="w-3 h-3 text-gray-400" />
                              <p className="text-xs text-gray-500">
                                {dept.member_count} members
                              </p>
                            </div>
                          </Link>
                        ))}
                        {departments.length > 5 && (
                          <p className="text-xs text-gray-500 text-center mt-2">
                            +{departments.length - 5} more departments
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Owner Information */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <UsersIcon className="w-5 h-5 text-gray-400" />
                      Company Owner
                    </h2>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">
                        {company.owner_details.username}
                      </p>
                      <p className="text-sm text-gray-500">
                        {company.owner_details.email}
                      </p>
                    </div>
                  </div>

                  {/* Verification Info */}
                  {company.verified_at && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        <p className="text-sm font-medium text-green-900">
                          Verified Company
                        </p>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        Verified on{" "}
                        {new Date(company.verified_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
            <div className="relative bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Edit Company
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateCompany} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name *
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

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Legal Name
                    </label>
                    <input
                      type="text"
                      value={formData.legal_name}
                      onChange={(e) =>
                        setFormData({ ...formData, legal_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Type
                    </label>
                    <select
                      value={formData.company_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company_type: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select type</option>
                      {companyTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Industry
                    </label>
                    <select
                      value={formData.industry}
                      onChange={(e) =>
                        setFormData({ ...formData, industry: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select industry</option>
                      {industries.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      value={formData.address_line1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address_line1: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={formData.address_line2}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address_line2: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          postal_code: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax ID
                    </label>
                    <input
                      type="text"
                      value={formData.tax_id}
                      onChange={(e) =>
                        setFormData({ ...formData, tax_id: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      value={formData.registration_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          registration_number: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
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
    </MainLayout>
  );
}
