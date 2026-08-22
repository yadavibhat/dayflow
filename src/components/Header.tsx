"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useCheckInStatus } from "@/hooks/useDashboardStats";

import { Logo } from "@/components/Logo";
import { SystrayCheckInOut } from "@/components/attendance/SystrayCheckInOut";

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const pathname = usePathname();
  const {
    currentUser,
    currentRole,
    setRole,
    auditLogs,
    leaves,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const toggleRole = () => {
    setRole(currentRole === "admin" ? "employee" : "admin");
    setShowProfileMenu(false);
  };

  const navItems = [
    { name: "Employees", href: "/employees" },
    { name: "Attendance", href: "/attendance" },
    { name: "Time Off", href: "/timeoff" },
  ];

  // Derived real notifications from recent audit activity and pending leaves
  const recentNotifications = auditLogs.slice(0, 5);

  return (
    <header className="glass-panel border-b border-border-light h-16 flex items-center justify-between w-full px-gutter-mobile md:px-gutter-desktop sticky top-0 z-40 bg-surface-container-lowest/80">
      {/* Brand & Desktop SubNav */}
      <div className="flex items-center gap-space-xl h-full">
        {/* Mobile Hamburger menu */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-space-sm text-secondary hover:text-primary transition-colors focus:outline-none"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        <div className="block lg:hidden">
          <Link href="/dashboard" className="flex items-center">
            <Logo variant="full" size="sm" />
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-space-lg h-full pt-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`pb-1 border-b-2 text-label-md font-label-md transition-colors duration-200 ${
                  isActive
                    ? "text-primary border-primary font-bold"
                    : "text-secondary border-transparent hover:text-primary hover:border-border-light font-medium"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Action Buttons & Systray */}
      <div className="flex items-center gap-space-md">
        {/* Persistent Check-In / Check-Out Systray Control */}
        <SystrayCheckInOut />

        {/* Notifications and Help */}
        <div className="flex items-center gap-space-xs text-secondary border-l border-border-light pl-space-sm">
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
                setShowHelpModal(false);
              }}
              className={`p-2 hover:bg-surface-container-low rounded-full transition-colors relative ${
                showNotifications ? "bg-surface-container-low text-primary" : ""
              }`}
              title="Notifications"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              {recentNotifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-container-lowest border border-border-light rounded-xl shadow-xl z-50 p-space-md">
                <div className="flex items-center justify-between mb-space-sm pb-space-xs border-b border-border-light">
                  <h4 className="font-headline-md text-label-md text-primary font-bold">
                    Activity &amp; Notifications
                  </h4>
                  <span className="text-[11px] text-secondary font-mono">Real-time</span>
                </div>
                <div className="space-y-space-sm max-h-72 overflow-y-auto">
                  {recentNotifications.length === 0 ? (
                    <p className="text-xs text-secondary py-3 text-center">No new notifications.</p>
                  ) : (
                    recentNotifications.map((log) => (
                      <div key={log.id} className="border-b border-surface-container-low pb-2 text-xs">
                        <p className="text-primary font-semibold">
                          {log.user}: <span className="font-normal text-slate-700">{log.action}</span>
                        </p>
                        <p className="text-[10px] text-secondary mt-0.5 font-mono">{log.timestamp}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Help & Support Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowHelpModal(!showHelpModal);
                setShowNotifications(false);
                setShowProfileMenu(false);
              }}
              className={`p-2 hover:bg-surface-container-low rounded-full transition-colors hidden sm:block ${
                showHelpModal ? "bg-surface-container-low text-primary" : ""
              }`}
              title="Help & Support Guide"
            >
              <span className="material-symbols-outlined text-xl">info</span>
            </button>

            {showHelpModal && (
              <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-border-light rounded-xl shadow-xl z-50 p-space-md text-xs">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-border-light">
                  <h4 className="font-bold text-primary text-sm">Dayflow HRMS Guide</h4>
                  <button onClick={() => setShowHelpModal(false)} className="text-secondary hover:text-primary">✕</button>
                </div>
                <ul className="space-y-1.5 text-slate-600">
                  <li>• <strong>Systray Check-In</strong>: Use the top bar to record daily attendance punches.</li>
                  <li>• <strong>Time Off</strong>: Apply for leaves and track approved balances in ₹ INR.</li>
                  <li>• <strong>Role Switch</strong>: Use the profile menu to switch between Employee and HR views.</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Avatar with Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 focus:outline-none"
          >
            {currentUser.avatar ? (
              <img
                alt="User avatar"
                className="w-8 h-8 rounded-full object-cover border border-border-light"
                src={currentUser.avatar}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-secondary font-bold text-sm border border-border-light">
                {currentUser.name.split(" ").map((n: string) => n[0]).join("")}
              </div>
            )}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-border-light rounded-xl shadow-xl z-50 py-space-sm">
              <div className="px-space-md py-space-sm border-b border-border-light">
                <p className="font-label-md text-label-md text-primary font-bold">{currentUser.name}</p>
                <p className="text-xs text-secondary font-medium">{currentUser.role}</p>
              </div>
              <button
                onClick={toggleRole}
                className="w-full text-left px-space-md py-3 text-body-md text-primary hover:bg-surface-container-low transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-secondary text-lg">swap_horiz</span>
                Switch to {currentRole === "admin" ? "Employee View" : "HR Admin View"}
              </button>
              <div className="border-t border-border-light mt-1 pt-1">
                <Link
                  href="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-space-md py-3 text-body-md text-primary hover:bg-surface-container-low transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-secondary text-lg">person</span>
                  My Profile
                </Link>
                <Link
                  href="/signin"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-space-md py-3 text-body-md text-danger-text hover:bg-danger-soft transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Log Out
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
