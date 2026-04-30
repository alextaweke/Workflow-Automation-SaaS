// components/workspaces/WorkspaceCard.tsx
"use client";

import { useRouter } from "next/navigation";
import { Users, Calendar, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default interface WorkspaceCardProps {
  workspace: {
    id: number;
    name: string;
    description?: string;
    plan: string;
    member_count: number;
    created_at: string;
    total_tasks: number;
    completed_tasks: number;
  };
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {workspace.name}
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
            {workspace.plan}
          </span>
        </div>

        {workspace.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {workspace.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{workspace.member_count} members</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              Created {formatDistanceToNow(new Date(workspace.created_at))} ago
            </span>
          </div>
        </div>

        <button
          onClick={() => router.push(`/workspaces/${workspace.id}`)}
          className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
        >
          <span className="text-sm font-medium text-gray-700">
            Open Workspace
          </span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
