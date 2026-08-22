"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";

import { Logo } from "@/components/Logo";

import { performLogout } from "@/lib/authLogout";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { currentRole } = useApp();

  const handleLogout = async () => {
    await performLogout();
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      visible: true,
    },
    {
      name: "Employees",
      href: "/employees",
      icon: "groups",
      visible: true,
    },
    {
      name: "Attendance",
      href: "/attendance",
      icon: "clinical_notes",
      visible: true,
    },
    {
      name: "Time Off",
      href: "/timeoff",
      icon: "event_busy",
      visible: true,
    },
    {
      name: "Payroll",
      href: currentRole === "admin" ? "/hr/payroll" : "/payroll",
      icon: "payments",
      visible: true,
    },
    {
      name: "Audit Log",
      href: "/hr/audit",
      icon: "manage_search",
      visible: currentRole === "admin",
    },
    {
      name: "Reports",
      href: "/reports",
      icon: "assessment",
      visible: currentRole === "admin",
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-low border-r border-border-light p-space-md gap-space-sm z-50">
      {/* Brand Header */}
      <div className="flex items-center mb-space-xl p-space-sm">
        <Link href="/dashboard" className="flex items-center">
          <Logo variant="full" size="md" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-space-xs">
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-space-sm p-space-sm rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-on-primary font-bold scale-[0.98]"
                    : "text-secondary hover:bg-surface-container-high hover:text-primary font-medium"
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-label-md font-label-md">{item.name}</span>
              </Link>
            );
          })}
      </nav>

      {/* Sidebar Footer */}
      <div className="mt-auto flex flex-col gap-space-xs pt-space-md border-t border-border-light">
        <Link
          href="/profile"
          className={`flex items-center gap-space-sm p-space-sm rounded-xl transition-all duration-200 ${
            pathname === "/profile"
              ? "bg-primary text-on-primary font-bold scale-[0.98]"
              : "text-secondary hover:bg-surface-container-high hover:text-primary font-medium"
          }`}
        >
          <span className="material-symbols-outlined">person</span>
          <span className="text-label-md font-label-md">My Profile</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-space-sm p-space-sm text-secondary hover:bg-danger-soft hover:text-danger-text rounded-xl transition-all duration-200 font-medium cursor-pointer w-full text-left"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-label-md font-label-md">Log Out</span>
        </button>
      </div>
    </aside>
  );
};
