// components/companies/CompanyCard.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  Calendar,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CompanyCardProps {
  company: {
    id: number;
    name: string;
    description: string;
    company_type: string;
    industry: string;
    member_count: number;
    department_count: number;
    is_verified: boolean;
    created_at: string;
    primary_color?: string;
  };
}

export function CompanyCard({ company }: CompanyCardProps) {
  const router = useRouter();

  const getIndustryIcon = () => {
    switch (company.industry) {
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

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200">
      <div
        className="h-2 rounded-t-lg"
        style={{ backgroundColor: company.primary_color || "#3B82F6" }}
      />
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-2xl">
              {getIndustryIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {company.name}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                {getCompanyTypeLabel(company.company_type)}
              </p>
            </div>
          </div>
          {company.is_verified && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">Verified</span>
            </div>
          )}
        </div>

        {company.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {company.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{company.member_count} members</span>
          </div>
          <div className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            <span>{company.department_count} departments</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              Created {formatDistanceToNow(new Date(company.created_at))} ago
            </span>
          </div>
        </div>

        <button
          onClick={() => router.push(`/companies/${company.id}`)}
          className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
        >
          <span className="text-sm font-medium text-gray-700">
            View Company
          </span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
