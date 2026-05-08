"use client";

import { TaskStats } from "@/types";
import {
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface DashboardStatsProps {
  stats: TaskStats;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Total Tasks",
      value: stats.total_tasks,
      icon: ClipboardDocumentCheckIcon,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      link: "/tasks",
      change: "+12%",
      trend: "up",
    },
    {
      title: "In Progress",
      value: stats.in_progress,
      icon: ClockIcon,
      color: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
      link: "/tasks?status=in_progress",
      change: "+5%",
      trend: "up",
    },
    {
      title: "Completed",
      value: stats.completed_tasks,
      icon: CheckCircleIcon,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      link: "/tasks?status=done",
      change: "+23%",
      trend: "up",
    },
    {
      title: "Completion Rate",
      value: `${stats.completion_rate}%`,
      icon: ArrowTrendingUpIcon,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      link: "/analytics",
      change: "+8%",
      trend: "up",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Link
            key={stat.title}
            href={stat.link}
            className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform`}
                >
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <ArrowTrendingUpIcon className="w-3 h-3" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-3 h-3" />
                  )}
                  {stat.change}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </h3>
              <p className="text-sm text-gray-600">{stat.title}</p>
              <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-500 group-hover:animate-pulse`}
                  style={{
                    width:
                      stat.title === "Completion Rate"
                        ? stat.value
                        : `${(Number(stat.value) / 100) * 100}%`,
                  }}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
