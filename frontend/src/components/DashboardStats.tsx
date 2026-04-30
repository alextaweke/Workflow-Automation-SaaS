// components/DashboardStats.tsx
"use client";

import { TaskStats } from "@/types";
import { motion } from "framer-motion";

interface DashboardStatsProps {
  stats: TaskStats;
}

const statCards = [
  {
    key: "total_tasks",
    label: "Total Tasks",
    icon: "📋",
    color: "bg-blue-500",
  },
  {
    key: "completed_tasks",
    label: "Completed",
    icon: "✅",
    color: "bg-green-500",
  },
  {
    key: "in_progress",
    label: "In Progress",
    icon: "🔄",
    color: "bg-yellow-500",
  },
  { key: "todo", label: "Todo", icon: "📝", color: "bg-gray-500" },
  { key: "overdue", label: "Overdue", icon: "⚠️", color: "bg-red-500" },
  {
    key: "high_priority",
    label: "High Priority",
    icon: "🔴",
    color: "bg-orange-500",
  },
];

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {statCards.map((card, index) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{card.icon}</span>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${card.color} text-white`}
            >
              {card.label}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats[card.key as keyof TaskStats] || 0}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
