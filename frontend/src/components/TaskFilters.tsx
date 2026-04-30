// components/tasks/TaskFilters.tsx (Enhanced version)
"use client";

import { useState } from "react";
import { useTaskStore } from "@/stores/taskStore";
import { Filter, X, ChevronDown } from "lucide-react";
interface TaskFiltersProps {
  filters: {
    status: string;
    priority: string;
    search: string;
  };

  setFilters: React.Dispatch<
    React.SetStateAction<{
      status: string;
      priority: string;
      search: string;
    }>
  >;
}
export function TaskFilters({ filters, setFilters }: TaskFiltersProps) {
  const { fetchTasks } = useTaskStore();
  const [isOpen, setIsOpen] = useState(false);
  const [filterss, setFilterss] = useState({
    status: [] as string[],
    priority: [] as string[],
    tags: "",
    is_overdue: false,
    assigned_to: "",
  });

  const statusOptions = ["todo", "in_progress", "review", "done"];
  const priorityOptions = ["low", "medium", "high", "urgent", "critical"];

  const applyFilters = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryParams: any = {};
    if (filters.status.length) queryParams.status = filterss.status.join(",");
    if (filters.priority.length)
      queryParams.priority = filterss.priority.join(",");
    if (filterss.tags) queryParams.tags = filterss.tags;
    if (filterss.is_overdue) queryParams.is_overdue = "true";
    if (filterss.assigned_to) queryParams.assigned_to = filterss.assigned_to;
    fetchTasks(queryParams);
    setIsOpen(false);
  };

  const clearFilters = () => {
    setFilterss({
      status: [],
      priority: [],
      tags: "",
      is_overdue: false,
      assigned_to: "",
    });
    fetchTasks();
    setIsOpen(false);
  };

  const toggleStatus = (status: string) => {
    setFilterss((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status],
    }));
  };

  const togglePriority = (priority: string) => {
    setFilterss((prev) => ({
      ...prev,
      priority: prev.priority.includes(priority)
        ? prev.priority.filter((p) => p !== priority)
        : [...prev.priority, priority],
    }));
  };

  const activeFilterCount =
    filterss.status.length +
    filterss.priority.length +
    (filterss.tags ? 1 : 0) +
    (filterss.is_overdue ? 1 : 0) +
    (filterss.assigned_to ? 1 : 0);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
      >
        <Filter className="h-4 w-4" />
        Filters
        {activeFilterCount > 0 && (
          <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-white rounded-lg shadow-lg border z-10">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Filter Tasks</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="space-y-2">
                  {statusOptions.map((status) => (
                    <label
                      key={status}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.status.includes(status)}
                        onChange={() => toggleStatus(status)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm capitalize">
                        {status.replace("_", " ")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <div className="space-y-2">
                  {priorityOptions.map((priority) => (
                    <label
                      key={priority}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.priority.includes(priority)}
                        onChange={() => togglePriority(priority)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm capitalize">{priority}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tags Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={filterss.tags}
                  onChange={(e) =>
                    setFilterss({ ...filterss, tags: e.target.value })
                  }
                  placeholder="bug, feature, urgent"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {/* Overdue Filter */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterss.is_overdue}
                  onChange={(e) =>
                    setFilterss({ ...filterss, is_overdue: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Show overdue only</span>
              </label>
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t">
              <button
                onClick={applyFilters}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
