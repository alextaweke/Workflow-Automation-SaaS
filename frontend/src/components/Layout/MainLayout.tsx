// components/Layout/MainLayout.tsx
"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "@heroicons/react/24/outline";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore((state) => state);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { name: "My Tasks", href: "/tasks", icon: ClipboardDocumentListIcon },
    { name: "Workspace", href: "/workspaces", icon: BriefcaseIcon },
    { name: "Companies", href: "/companies", icon: BuildingOfficeIcon },
    { name: "Team", href: "/team", icon: UsersIcon },
    { name: "Analytics", href: "/analytics", icon: ChartBarIcon },
  ];

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
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <BellIcon className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>

              {/* Create Task Button */}
              {/* <Link
                href="/tasks/create"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:shadow-md"
              >
                <PlusIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Create Task</span>
              </Link> */}

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
                              {user?.email || "alextaweke@gmail.com"}
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

// "use client";

// import { ReactNode, useState, useMemo } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useAuth } from "@/context/AuthContext";
// import {
//   HomeIcon,
//   ClipboardDocumentListIcon,
//   BriefcaseIcon,
//   BuildingOfficeIcon,
//   UsersIcon,
//   ChartBarIcon,
//   BellIcon,
//   Cog6ToothIcon,
//   ArrowRightOnRectangleIcon,
//   WalletIcon,
//   UserGroupIcon,
//   PlusIcon,
// } from "@heroicons/react/24/outline";
// import { role } from "@/types";

// interface MainLayoutProps {
//   children: ReactNode;
// }

// export default function MainLayout({ children }: MainLayoutProps) {
//   const pathname = usePathname();
//   const { user, logout } = useAuth();
//   const [showUserMenu, setShowUserMenu] = useState(false);

//   const role = user?.role;

//   // -----------------------------
//   // ROLE-BASED NAVIGATION
//   // -----------------------------
//   const navigationItems = useMemo(() => {
//     const baseItems = [
//       { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
//       { name: "My Tasks", href: "/tasks", icon: ClipboardDocumentListIcon },
//     ];

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const roleBasedItems: Record<string, any[]> = {
//       super_admin: [
//         { name: "Workspace", href: "/workspaces", icon: BriefcaseIcon },
//         { name: "Companies", href: "/companies", icon: BuildingOfficeIcon },
//         { name: "Team", href: "/team", icon: UsersIcon },
//         { name: "Analytics", href: "/analytics", icon: ChartBarIcon },
//       ],

//       admin: [
//         { name: "Workspace", href: "/workspaces", icon: BriefcaseIcon },
//         { name: "Companies", href: "/companies", icon: BuildingOfficeIcon },
//         { name: "Team", href: "/team", icon: UsersIcon },
//         { name: "Analytics", href: "/analytics", icon: ChartBarIcon },
//       ],

//       manager: [
//         { name: "Workspace", href: "/workspaces", icon: BriefcaseIcon },
//         { name: "Team", href: "/team", icon: UsersIcon },
//         { name: "Analytics", href: "/analytics", icon: ChartBarIcon },
//       ],

//       member: [{ name: "Workspace", href: "/workspaces", icon: BriefcaseIcon }],

//       viewer: [],
//     };

//     return [...baseItems, ...(roleBasedItems[role || "member"] || [])];
//   }, [role]);

//   // -----------------------------
//   // ROLE HELPERS
//   // -----------------------------
//   const canCreateTask =
//     role === "admin" || role === "manager" || role === "super_admin";

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* HEADER */}
//       <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             {/* LOGO */}
//             <div className="flex items-center gap-8">
//               <Link href="/dashboard" className="flex items-center gap-2">
//                 <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
//                   <BriefcaseIcon className="w-5 h-5 text-white" />
//                 </div>
//                 <span className="text-xl font-bold">TaskFlow</span>
//               </Link>

//               {/* NAV */}
//               <nav className="hidden md:flex items-center gap-1">
//                 {navigationItems.map((item) => {
//                   const isActive =
//                     pathname === item.href ||
//                     pathname?.startsWith(item.href + "/");

//                   return (
//                     <Link
//                       key={item.name}
//                       href={item.href}
//                       className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
//                         isActive
//                           ? "bg-gray-100 text-gray-900"
//                           : "text-gray-600 hover:bg-gray-50"
//                       }`}
//                     >
//                       <item.icon className="w-4 h-4" />
//                       {item.name}
//                     </Link>
//                   );
//                 })}
//               </nav>
//             </div>

//             {/* RIGHT SIDE */}
//             <div className="flex items-center gap-4">
//               {/* NOTIFICATIONS */}
//               <button className="relative p-2 text-gray-500 hover:text-gray-700">
//                 <BellIcon className="w-5 h-5" />
//               </button>

//               {/* CREATE TASK (ROLE BASED) */}
//               {canCreateTask && (
//                 <Link
//                   href="/tasks/create"
//                   className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//                 >
//                   <PlusIcon className="w-4 h-4" />
//                   Create Task
//                 </Link>
//               )}

//               {/* USER */}
//               <div className="relative">
//                 <button
//                   onClick={() => setShowUserMenu(!showUserMenu)}
//                   className="flex items-center gap-2"
//                 >
//                   <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
//                     {user?.first_name?.charAt(0) ||
//                       user?.username?.charAt(0) ||
//                       "U"}
//                   </div>
//                 </button>

//                 {/* DROPDOWN */}
//                 {showUserMenu && (
//                   <>
//                     <div
//                       className="fixed inset-0"
//                       onClick={() => setShowUserMenu(false)}
//                     />

//                     <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-lg border z-50">
//                       <div className="px-4 py-3 border-b">
//                         <p className="font-medium">
//                           {user?.first_name || user?.username}
//                         </p>
//                         <p className="text-xs text-gray-500">{user?.email}</p>
//                         <p className="text-xs text-blue-500 capitalize">
//                           {user?.role}
//                         </p>
//                       </div>

//                       <Link
//                         href="/profile"
//                         className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
//                       >
//                         <UserGroupIcon className="w-4 h-4" />
//                         Profile
//                       </Link>

//                       <Link
//                         href="/settings"
//                         className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
//                       >
//                         <Cog6ToothIcon className="w-4 h-4" />
//                         Settings
//                       </Link>

//                       <button
//                         onClick={() => {
//                           setShowUserMenu(false);
//                           logout();
//                         }}
//                         className="flex w-full items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50"
//                       >
//                         <ArrowRightOnRectangleIcon className="w-4 h-4" />
//                         Logout
//                       </button>
//                     </div>
//                   </>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* CONTENT */}
//       <main className="py-8">{children}</main>
//     </div>
//   );
// }
