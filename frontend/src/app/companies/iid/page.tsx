// app/companies/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCompanyStore } from "@/stores/companyStore";
import {
  Building2,
  Users,
  Calendar,
  CheckCircle,
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  Globe,
  Award,
  TrendingUp,
  Shield,
  Edit,
  User,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface Company {
  id: number;
  uuid: string;
  name: string;
  legal_name: string;
  description: string;
  company_type: string;
  industry: string;
  member_count: number;
  department_count: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  verified_at: string | null;
  primary_color?: string;
  email?: string;
  phone?: string;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  full_address?: string;
  tax_id?: string;
  registration_number?: string;
  logo?: string | null;
  owner: number;
  owner_details?: {
    id: number;
    username: string;
    email: string;
  };
}

export default function CompanyDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { fetchCompanyById, isLoading } = useCompanyStore();
  const [company, setCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        if (id && typeof id === "string") {
          const data = await fetchCompanyById(parseInt(id));
          setCompany(data as unknown as Company);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load company");
      }
    };

    loadCompany();
  }, [id, fetchCompanyById]);

  const getIndustryIcon = () => {
    switch (company?.industry) {
      case "technology":
        return "💻";
      case "healthcare":
        return "🏥";
      case "finance":
        return "💰";
      case "education":
        return "📚";
      case "retail":
        return "🛒";
      default:
        return "🏢";
    }
  };

  const getCompanyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      corporation: "Corporation",
      llc: "LLC",
      partnership: "Partnership",
      sole_proprietorship: "Sole Proprietorship",
      nonprofit: "Non-Profit",
      government: "Government",
    };
    return types[type] || type;
  };

  const getIndustryLabel = (industry: string) => {
    const industries: Record<string, string> = {
      technology: "Technology",
      healthcare: "Healthcare",
      finance: "Finance",
      education: "Education",
      retail: "Retail",
      manufacturing: "Manufacturing",
      consulting: "Consulting",
    };
    return industries[industry] || industry;
  };

  const getFullAddress = () => {
    if (company?.full_address) return company.full_address;

    const parts = [
      company?.address_line1,
      company?.address_line2,
      company?.city,
      company?.state,
      company?.postal_code,
      company?.country,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : "No address provided";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading company details...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">!</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Company Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "The company you're looking for doesn't exist."}
          </p>
          <button
            onClick={() => router.push("/companies")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Companies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div
        className="h-48 lg:h-64 w-full relative"
        style={{ backgroundColor: company.primary_color || "#3B82F6" }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="pt-8 flex justify-between items-start">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-white bg-black bg-opacity-20 hover:bg-opacity-30 rounded-lg px-3 py-2 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back</span>
            </button>
            <button
              onClick={() => router.push(`/companies/${company.id}/edit`)}
              className="inline-flex items-center gap-2 text-white bg-black bg-opacity-20 hover:bg-opacity-30 rounded-lg px-3 py-2 transition"
            >
              <Edit className="h-4 w-4" />
              <span className="text-sm">Edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Company Info Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 lg:-mt-24">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 lg:h-24 lg:w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl lg:text-4xl shadow-lg">
                  {getIndustryIcon()}
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                      {company.name}
                    </h1>
                    {company.is_verified ? (
                      <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">
                          Verified
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                        <span className="text-xs text-yellow-600 font-medium">
                          Pending Verification
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">
                    {getCompanyTypeLabel(company.company_type)} •{" "}
                    {getIndustryLabel(company.industry)}
                  </p>
                  {company.legal_name &&
                    company.legal_name !== company.name && (
                      <p className="text-sm text-gray-500 mt-1">
                        Legal Name: {company.legal_name}
                      </p>
                    )}
                </div>
              </div>

              <div className="flex gap-3">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                  Join Company
                </button>
                <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
                  Share
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Total Members</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {company.member_count?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Departments</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {company.department_count || 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Founded</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {format(new Date(company.created_at), "yyyy")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 lg:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                About {company.name}
              </h2>
              {company.description ? (
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {company.description}
                </p>
              ) : (
                <p className="text-gray-500 italic">
                  No description provided yet.
                </p>
              )}
            </div>

            {/* Benefits Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 lg:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Why Join {company.name}?
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Career Growth</h3>
                    <p className="text-sm text-gray-600">
                      Access to learning resources and career development
                      opportunities
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Network with Professionals
                    </h3>
                    <p className="text-sm text-gray-600">
                      Connect with {company.member_count?.toLocaleString() || 0}
                      + professionals in your industry
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Exclusive Resources
                    </h3>
                    <p className="text-sm text-gray-600">
                      Access member-only content, events, and benefits
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Company Details Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Company Information
              </h3>
              <div className="space-y-3">
                {company.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <a
                      href={`mailto:${company.email}`}
                      className="text-blue-600 hover:underline truncate"
                    >
                      {company.email}
                    </a>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <a
                      href={`tel:${company.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {company.phone}
                    </a>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {company.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">{getFullAddress()}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax ID / VAT</span>
                  <span className="text-gray-900 font-medium">
                    {company.tax_id || "Not provided"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Registration Number</span>
                  <span className="text-gray-900 font-medium">
                    {company.registration_number || "Not provided"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Company Age</span>
                  <span className="text-gray-900 font-medium">
                    {formatDistanceToNow(new Date(company.created_at))} old
                  </span>
                </div>
                {company.owner_details && (
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-gray-500">Owner</span>
                    <span className="text-gray-900 font-medium">
                      {company.owner_details.username}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Active Status</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      company.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {company.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-900">
                    {format(new Date(company.created_at), "MMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="text-gray-900">
                    {formatDistanceToNow(new Date(company.updated_at))} ago
                  </span>
                </div>
              </div>
            </div>

            {/* Verification Badge Card */}
            {company.is_verified ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">
                    Verified Company
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  This company has been verified by our team. All information is
                  authentic and up-to-date.
                </p>
                {company.verified_at && (
                  <p className="text-xs text-gray-500 mt-2">
                    Verified on{" "}
                    {format(new Date(company.verified_at), "MMMM dd, yyyy")}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold text-gray-900">
                    Verification Pending
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  This company is awaiting verification. Some features may be
                  limited until verified.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
