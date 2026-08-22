"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useCheckInStatus } from "@/hooks/useDashboardStats";
import { Logo } from "@/components/Logo";

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const pathname = usePathname();
  const {
    currentUser,
    currentRole,
    setRole,
    attendance,
    checkIn,
    checkOut,
    leaves,
    auditLogs,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Live Supabase check-in status with AppContext as immediate fallback
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAttendance = attendance.find(
    (a) => a.employeeId === currentUser.id && a.date === todayStr
  );
  const localCheckedIn =
    !!todayAttendance && todayAttendance.checkIn !== "--:--";
  const localCheckedOut =
    !!todayAttendance && todayAttendance.checkOut !== "--:--";

  const { status: liveStatus } = useCheckInStatus(currentUser.id, {
    checkedIn: localCheckedIn,
    checkedOut: localCheckedOut,
    checkInTime: todayAttendance?.checkIn ?? null,
  });

  const isCheckedIn = liveStatus.checkedIn;
  const isCheckedOut = liveStatus.checkedOut;

  const toggleRole = () => {
    setRole(currentRole === "admin" ? "employee" : "admin");
    setShowProfileMenu(false);
  };

  const navItems = [
    { name: "Employees", href: "/employees" },
    { name: "Attendance", href: "/attendance" },
    { name: "Time Off", href: "/timeoff" },
  ];

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

      {/* Action Buttons */}
      <div className="flex items-center gap-space-md">
        {/* Attendance Controls */}
        <div className="flex items-center gap-space-sm">
          <button
            onClick={() => checkIn(currentUser.id)}
            disabled={isCheckedIn}
            className={`hidden md:block px-4 py-2 rounded font-label-md text-label-md transition-all duration-200 ${
              isCheckedIn
                ? "bg-surface-container-low text-secondary border border-border-light cursor-not-allowed opacity-60"
                : "bg-ink text-on-primary hover:opacity-90 active:scale-95"
            }`}
          >
            {isCheckedIn ? "Checked In" : "Check-In"}
          </button>
          <button
            onClick={() => checkOut(currentUser.id)}
            disabled={!isCheckedIn || isCheckedOut}
            className={`hidden md:block px-4 py-2 rounded border font-label-md text-label-md transition-all duration-200 ${
              !isCheckedIn || isCheckedOut
                ? "bg-surface-container-low text-secondary border-border-light cursor-not-allowed opacity-60"
                : "bg-surface-container-lowest border-border-light text-secondary hover:bg-surface-container-low hover:text-primary active:scale-95"
            }`}
          >
            {isCheckedOut ? "Checked Out" : "Check-Out"}
          </button>
        </div>

        {/* Notifications and Help */}
        <div className="flex items-center gap-space-xs text-secondary border-l border-border-light pl-space-sm">
          <div className="relative">
            {(() => {
              // Generate dynamic notifications
              const userNotifications: Array<{ title: string; message: string }> = [];

              if (currentRole === "admin") {
                leaves
                  .filter((l) => l.status === "Pending")
                  .forEach((l) => {
                    userNotifications.push({
                      title: "Leave Approval Needed",
                      message: `${l.employeeName} requested ${l.type}.`,
                    });
                  });
                auditLogs.slice(0, 3).forEach((log) => {
                  userNotifications.push({
                    title: "System Log",
                    message: `${log.user} ${log.action}.`,
                  });
                });
              } else {
                leaves
                  .filter((l) => l.employeeName === currentUser.name)
                  .forEach((l) => {
                    userNotifications.push({
                      title: `Leave ${l.status}`,
                      message: `Your ${l.type} request was ${l.status.toLowerCase()}.`,
                    });
                  });
              }

              return (
                <>
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowProfileMenu(false);
                    }}
                    className={`p-2 hover:bg-surface-container-low rounded-full transition-colors relative ${
                      showNotifications ? "bg-surface-container-low text-primary" : ""
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">notifications</span>
                    {/* Notification dot */}
                    {userNotifications.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-text rounded-full"></span>
                    )}
                  </button>

                  {showNotifications && (
                     <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-border-light rounded-xl shadow-xl z-50 p-space-md max-h-96 overflow-y-auto">
                       <h4 className="font-headline-md text-label-md text-primary font-bold mb-space-sm pb-space-xs border-b border-border-light">
                         Notifications ({userNotifications.length})
                       </h4>
                       {userNotifications.length === 0 ? (
                         <div className="py-space-md text-center text-secondary font-body-md">
                           No new notifications.
                         </div>
                       ) : (
                         <div className="space-y-space-md text-body-md text-secondary">
                           {userNotifications.map((notif, idx) => (
                             <div key={idx} className="border-b border-surface-container-low last:border-0 pb-2 last:pb-0">
                               <p className="text-primary font-medium text-label-md">{notif.title}</p>
                               <p className="text-[12px] mt-0.5">{notif.message}</p>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                  )}
                </>
              );
            })()}
          </div>

          <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors hidden sm:block">
            <span className="material-symbols-outlined text-xl">help</span>
          </button>
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
