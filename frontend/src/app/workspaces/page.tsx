/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/static-components */
// app/page.tsx - Updated dashboard with fixes
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { WorkspaceCard } from "@/components/WorkspaceCard";
import {
  Plus,
  Users,
  Briefcase,
  CheckCircle,
  TrendingUp,
  Calendar,
  Activity,
} from "lucide-react";
import { Workspace } from "@/types";
import MainLayout from "@/components/Layout/MainLayout";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { workspaceApi } from "@/lib/workspaceApi";

export default function Dashboard() {
  const {
    workspaces,
    globalStats,
    fetchWorkspaces,
    fetchGlobalStats,
    isLoading,
  } = useWorkspaceStore();

  const [chartData, setChartData] = useState({
    taskTrends: [],
    workspaceDistribution: [],
    weeklyActivity: [],
  });
  const [isChartLoading, setIsChartLoading] = useState(true);

  useEffect(() => {
    fetchWorkspaces();
    fetchGlobalStats(); // This doesn't need workspaceId
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    setIsChartLoading(true);
    try {
      // Fetch real data from your Django backend
      const [taskTrendsData, workspaceDistData, weeklyActivityData] =
        await Promise.all([
          workspaceApi.getTaskTrends(),
          workspaceApi.getWorkspaceDistribution(),
          workspaceApi.getWeeklyActivity(),
        ]);

      setChartData({
        taskTrends: taskTrendsData.data || [],
        workspaceDistribution: workspaceDistData.data || [],
        weeklyActivity: weeklyActivityData.data || [],
      });
    } catch (error) {
      console.error("Error fetching chart data:", error);
      // Set empty data on error
      setChartData({
        taskTrends: [],
        workspaceDistribution: [],
        weeklyActivity: [],
      });
    } finally {
      setIsChartLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((p: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: p.color }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8 animate-fade-in">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
                  <p className="text-blue-100 text-lg">
                    Welcome back! Here&apos;s what&apos;s happening with your
                    workspaces.
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Workspaces
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {globalStats?.totalWorkspaces || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Members
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {globalStats?.totalMembers || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Completed Tasks
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {globalStats?.completedTasks || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">
                    Active Plan
                  </p>
                  <p className="text-3xl font-bold text-white capitalize">
                    {globalStats?.activePlan || "Free"}
                  </p>
                </div>
                <Link
                  href="/settings/billing"
                  className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-white hover:bg-white/30 transition-all text-sm font-medium"
                >
                  Upgrade
                </Link>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Task Trends */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Task Trends
                  </h3>
                  <p className="text-sm text-gray-500">
                    Monthly task completion overview
                  </p>
                </div>
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
              {isChartLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : chartData.taskTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.taskTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="#3B82F6"
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="inProgress"
                      stroke="#F59E0B"
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="pending"
                      stroke="#EF4444"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No task data available
                </div>
              )}
            </div>

            {/* Workspace Distribution */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Workspace Distribution
                  </h3>
                  <p className="text-sm text-gray-500">Status breakdown</p>
                </div>
              </div>
              {isChartLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : chartData.workspaceDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.workspaceDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`
                      }
                      outerRadius={100}
                      dataKey="value"
                    >
                      {chartData.workspaceDistribution.map(
                        (entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ),
                      )}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No workspace data available
                </div>
              )}
            </div>

            {/* Weekly Activity */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Weekly Activity
                  </h3>
                  <p className="text-sm text-gray-500">
                    Tasks and completions overview
                  </p>
                </div>
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              {isChartLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : chartData.weeklyActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData.weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="day" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="tasks"
                      stackId="1"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stackId="2"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No activity data available
                </div>
              )}
            </div>
          </div>

          {/* Workspaces Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  My Workspaces
                </h2>
                <p className="text-gray-500 mt-1">
                  Manage and collaborate on your projects
                </p>
              </div>
              <Link
                href="/workspaces/create"
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Workspace
              </Link>
            </div>

            {workspaces.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-16 text-center border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No workspaces yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Create your first workspace to start collaborating
                </p>
                <Link
                  href="/workspaces/create"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Workspace
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workspaces.map((workspace: Workspace, index: number) => (
                  <div
                    key={workspace.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <WorkspaceCard workspace={workspace} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </MainLayout>
  );
}
