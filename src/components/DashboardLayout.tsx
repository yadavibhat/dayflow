"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { currentRole } = useApp();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard", visible: true },
    { name: "Employees", href: "/employees", icon: "groups", visible: true },
    { name: "Attendance", href: "/attendance", icon: "clinical_notes", visible: true },
    { name: "Time Off", href: "/timeoff", icon: "event_busy", visible: true },
    { name: "Reports", href: "/reports", icon: "assessment", visible: currentRole === "admin" },
    { name: "My Profile", href: "/profile", icon: "person", visible: true },
  ];

  return (
    <div className="min-h-screen flex bg-slate-surface">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header onToggleMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Dynamic page content */}
        <div className="flex-1 overflow-x-hidden">{children}</div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-ink/30 z-50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-surface-container-low border-r border-border-light p-space-md flex flex-col gap-space-sm z-55 transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-space-lg px-2">
          <div className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">
              D
            </div>
            <div>
              <div className="font-headline-md text-label-md font-black text-primary leading-none">
                Dayflow
              </div>
              <div className="text-[10px] text-secondary uppercase tracking-wider mt-0.5">
                HR Management
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 hover:bg-surface-container-high rounded-full text-secondary"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-space-xs">
          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-space-sm p-space-sm rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-on-primary font-bold"
                      : "text-secondary hover:bg-surface-container-high hover:text-primary font-medium"
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="text-label-md font-label-md">{item.name}</span>
                </Link>
              );
            })}
        </nav>

        <div className="mt-auto border-t border-border-light pt-space-sm">
          <Link
            href="/signin"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-space-sm p-space-sm text-secondary hover:bg-surface-container-high hover:text-primary rounded-xl transition-all duration-200 font-medium"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-label-md font-label-md">Log Out</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
