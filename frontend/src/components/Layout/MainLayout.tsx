"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ChartBarIcon,
  BellIcon,
  PlusIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  WalletIcon,
  UserGroupIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore((state) => state);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { name: "My Tasks", href: "/tasks", icon: ClipboardDocumentListIcon },
    { name: "Companies", href: "/companies", icon: BuildingOfficeIcon },
    { name: "Team", href: "/team", icon: UsersIcon },
    { name: "Analytics", href: "/analytics", icon: ChartBarIcon },
  ];

  const handleWorkspaceClick = () => {
    router.push("/workspaces");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center transform transition-transform group-hover:scale-105">
                  <BriefcaseIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  TaskFlow
                </span>
              </Link>

              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {navigationItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname?.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                        isActive
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}

                {/* Workspace Button with Dropdown */}
                <div className="relative flex items-center">
                  <button
                    onClick={handleWorkspaceClick}
                    className={`px-3 py-2 rounded-l-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      pathname === "/workspaces" ||
                      pathname === "/workspaces/create"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <BriefcaseIcon className="w-4 h-4" />
                    Workspace
                  </button>
                  <button
                    onClick={() =>
                      setShowWorkspaceDropdown(!showWorkspaceDropdown)
                    }
                    className={`px-2 py-2 rounded-r-lg text-sm font-medium transition-all duration-200 flex items-center border-l ${
                      pathname === "/workspaces" ||
                      pathname === "/workspaces/create"
                        ? "bg-gray-100 text-gray-900 border-gray-200"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent"
                    }`}
                  >
                    <ChevronDownIcon
                      className={`w-4 h-4 transition-transform ${showWorkspaceDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {showWorkspaceDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowWorkspaceDropdown(false)}
                      />
                      <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 z-50 animate-fade-in">
                        <div className="py-2">
                          <Link
                            href="/workspaces"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowWorkspaceDropdown(false)}
                          >
                            <BriefcaseIcon className="w-4 h-4" />
                            Workspaces
                          </Link>
                          <Link
                            href="/workspaces/create"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                            onClick={() => setShowWorkspaceDropdown(false)}
                          >
                            <PlusIcon className="w-4 h-4" />
                            Create Workspace
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <BellIcon className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name || user?.username || "User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role || "Project Manager"}
                  </p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user?.first_name?.charAt(0) ||
                        user?.username?.charAt(0) ||
                        "U"}
                    </div>
                  </button>

                  {/* Dropdown menu */}
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 z-50 animate-fade-in">
                        <div className="py-2">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">
                              {user?.first_name || user?.username || "User"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user?.email || "user@example.com"}
                            </p>
                          </div>
                          <Link
                            href="/profile"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <UserGroupIcon className="w-4 h-4" />
                            Your Profile
                          </Link>
                          <Link
                            href="/settings"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Cog6ToothIcon className="w-4 h-4" />
                            Settings
                          </Link>
                          <Link
                            href="/earnings"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <WalletIcon className="w-4 h-4" />
                            Earnings
                          </Link>
                          <hr className="my-2" />
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              logout();
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <ArrowRightOnRectangleIcon className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">{children}</main>
    </div>
  );
}
