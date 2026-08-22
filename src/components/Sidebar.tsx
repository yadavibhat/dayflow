"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { currentRole } = useApp();

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
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
      name: "Reports",
      href: "/reports",
      icon: "assessment",
      visible: currentRole === "admin", // Only show reports for admin role
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-low border-r border-border-light p-space-md gap-space-sm z-50">
      {/* Brand Header */}
      <div className="flex items-center gap-space-sm mb-space-xl p-space-sm">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary">
          <span
            className="material-symbols-outlined"
            data-weight="fill"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            corporate_fare
          </span>
        </div>
        <div>
          <h1 className="font-headline-md text-headline-md font-black text-primary leading-none">
            Dayflow
          </h1>
          <p className="font-label-sm text-label-sm text-secondary mt-1 uppercase tracking-wider">
            HR Management
          </p>
        </div>
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
        <Link
          href="/signin"
          onClick={() => {
            // Optional: reset logic
          }}
          className="flex items-center gap-space-sm p-space-sm text-secondary hover:bg-surface-container-high hover:text-primary rounded-xl transition-all duration-200 font-medium"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-label-md font-label-md">Log Out</span>
        </Link>
      </div>
    </aside>
  );
};
