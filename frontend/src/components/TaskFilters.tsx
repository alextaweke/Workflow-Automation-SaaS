// components/AdvancedFilters.tsx
"use client";

import { useState } from "react";
import { X, Search } from "lucide-react";
import { Filters } from "@/types";

interface AdvancedFiltersProps {
  filters: Filters;
  setFilters: (filters: Filters) => void;
}

export default function AdvancedFilters({
  filters,
  setFilters,
}: AdvancedFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || "");

  const statusOptions = [
    { value: "todo", label: "To Do" },
    { value: "in_progress", label: "In Progress" },
    { value: "review", label: "Review" },
    { value: "done", label: "Done" },
    { value: "archived", label: "Archived" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
    { value: "critical", label: "Critical" },
  ];

  const handleStatusToggle = (status: string) => {
    const current = filters.status || [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    setFilters({ ...filters, status: updated, page: 1 });
  };

  const handlePriorityToggle = (priority: string) => {
    const current = filters.priority || [];
    const updated = current.includes(priority)
      ? current.filter((p) => p !== priority)
      : [...current, priority];
    setFilters({ ...filters, priority: updated, page: 1 });
  };

  const handleSearchSubmit = () => {
    setFilters({ ...filters, search: localSearch, page: 1 });
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      page_size: filters.page_size,
      status: [],
      priority: [],
      search: "",
    });
    setLocalSearch("");
  };

  const hasActiveFilters = () => {
    return !!(
      filters.status?.length ||
      filters.priority?.length ||
      filters.search ||
      filters.is_overdue ||
      filters.assigned_to ||
      filters.tags?.length
    );
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearchSubmit()}
            placeholder="Search by title, description, or tags..."
            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <button
          onClick={handleSearchSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {/* Status Filters */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusToggle(option.value)}
              className={`px-3 py-1 rounded-full text-sm transition ${
                filters.status?.includes(option.value)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Priority Filters */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority
        </label>
        <div className="flex flex-wrap gap-2">
          {priorityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handlePriorityToggle(option.value)}
              className={`px-3 py-1 rounded-full text-sm transition ${
                filters.priority?.includes(option.value)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Additional Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.is_overdue || false}
            onChange={(e) =>
              setFilters({ ...filters, is_overdue: e.target.checked, page: 1 })
            }
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Overdue only</span>
        </label>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters() && (
        <div className="pt-2">
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
