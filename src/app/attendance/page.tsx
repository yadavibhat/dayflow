"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";

export default function AttendancePage() {
  const { attendance, currentUser, leaves } = useApp();
  const [viewType, setViewType] = useState<"admin" | "employee">("admin");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Calculate employee stats for Employee View
  const myAttendance = attendance.filter((a) => a.employeeId === currentUser.id);
  const daysPresent = myAttendance.filter((a) => a.status === "Present" || a.status === "Late").length;
  const approvedLeaves = leaves.filter((l) => l.employeeId === currentUser.id && l.status === "Approved").length;
  
  // Search filter for Admin table
  const filteredAttendance = attendance.filter((item) =>
    item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-space-xl">
        {/* Page Header & View Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-space-md mb-space-lg">
          <div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-semibold mb-2">
              Attendance Management
            </h1>
            <p className="font-body-md text-body-md text-secondary">
              Monitor and manage employee time and attendance.
            </p>
          </div>
          {/* View Toggle */}
          <div className="flex p-1 bg-surface-container-low rounded-lg border border-border-light">
            <button
              className={`px-4 py-2 font-label-md text-label-md rounded-md transition-all cursor-pointer ${
                viewType === "admin"
                  ? "bg-surface-container-lowest shadow-sm border border-border-light text-primary font-bold"
                  : "text-secondary hover:text-primary font-medium"
              }`}
              onClick={() => setViewType("admin")}
            >
              HR/Admin View
            </button>
            <button
              className={`px-4 py-2 font-label-md text-label-md rounded-md transition-all cursor-pointer ${
                viewType === "employee"
                  ? "bg-surface-container-lowest shadow-sm border border-border-light text-primary font-bold"
                  : "text-secondary hover:text-primary font-medium"
              }`}
              onClick={() => setViewType("employee")}
            >
              Employee View
            </button>
          </div>
        </div>

        {/* VIEW: HR/Admin */}
        {viewType === "admin" && (
          <div className="flex flex-col gap-space-lg w-full">
            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl border border-border-light shadow-sm">
              <div className="relative w-full sm:w-80">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">
                  search
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-border-light rounded-lg font-body-md text-body-md focus:outline-none focus:border-primary text-primary transition-colors"
                  placeholder="Search employees..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-space-sm w-full sm:w-auto">
                <div className="flex items-center gap-2 border border-border-light rounded-lg px-3 py-2 bg-surface-container-lowest">
                  <button className="text-secondary hover:text-primary cursor-pointer">
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <span className="font-label-md text-label-md text-primary font-bold">
                    Today
                  </span>
                  <button className="text-secondary hover:text-primary cursor-pointer">
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
                <button className="border border-border-light rounded-lg px-4 py-2 bg-surface-container-lowest font-label-md text-label-md text-secondary hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer font-medium">
                  <span className="material-symbols-outlined text-sm">filter_list</span> Filter
                </button>
              </div>
            </div>

            {/* Admin Data Table */}
            <div className="bg-surface-container-lowest rounded-xl border border-border-light overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-surface border-b border-border-light">
                      <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                        Employee
                      </th>
                      <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                        Check In
                      </th>
                      <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                        Check Out
                      </th>
                      <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                        Work Hours
                      </th>
                      <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                        Extra Hours
                      </th>
                      <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-body-md divide-y divide-border-light">
                    {filteredAttendance.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-secondary font-body-md">
                          No attendance records found.
                        </td>
                      </tr>
                    ) : (
                      filteredAttendance.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-surface transition-colors"
                        >
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-secondary font-label-md text-label-md font-bold">
                              {item.employeeName.split(" ").map((n: string) => n[0]).join("")}
                            </div>
                            <span className="font-medium text-primary">{item.employeeName}</span>
                          </td>
                          <td className="px-6 py-4 text-secondary">{item.checkIn}</td>
                          <td className="px-6 py-4 text-secondary">{item.checkOut}</td>
                          <td className="px-6 py-4 text-primary font-medium">{item.workHours}</td>
                          <td className="px-6 py-4 text-secondary">{item.extraHours}</td>
                          <td className="px-6 py-4">
                            {item.status === "Present" && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-success-soft text-success-text font-label-sm text-label-sm font-bold">
                                Present
                              </span>
                            )}
                            {item.status === "Late" && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-warning-soft text-warning-text font-label-sm text-label-sm font-bold">
                                Late
                              </span>
                            )}
                            {item.status === "On Leave" && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-surface-container-low text-secondary font-label-sm text-label-sm font-bold">
                                On Leave
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="border-t border-border-light px-6 py-3 flex items-center justify-between bg-surface-container-lowest">
                <div className="font-label-md text-label-md text-secondary">
                  Showing 1 to {filteredAttendance.length} of {filteredAttendance.length} entries
                </div>
                <div className="flex gap-1">
                  <button
                    className="px-2 py-1 border border-border-light rounded text-secondary hover:bg-surface-container-low disabled:opacity-50 cursor-pointer"
                    disabled
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <button className="px-3 py-1 border border-primary bg-primary text-on-primary rounded font-label-md text-label-md font-bold">
                    1
                  </button>
                  <button className="px-2 py-1 border border-border-light rounded text-secondary hover:bg-surface-container-low cursor-pointer">
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Employee */}
        {viewType === "employee" && (
          <div className="flex flex-col gap-space-lg w-full">
            {/* Summary Stats Bento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
              <div className="bg-surface-container-lowest p-space-md rounded-xl border border-border-light flex flex-col gap-2 shadow-sm">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                  Days Present
                </span>
                <div className="font-headline-lg text-headline-lg font-bold text-primary">
                  {daysPresent}
                </div>
                <div className="font-label-md text-label-md text-secondary">Current Month</div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-xl border border-border-light flex flex-col gap-2 shadow-sm">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                  Leaves Taken
                </span>
                <div className="font-headline-lg text-headline-lg font-bold text-primary">
                  {approvedLeaves}
                </div>
                <div className="font-label-md text-label-md text-secondary">Current Month</div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-xl border border-border-light flex flex-col gap-2 shadow-sm">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                  Total Working Days
                </span>
                <div className="font-headline-lg text-headline-lg font-bold text-primary">
                  22
                </div>
                <div className="font-label-md text-label-md text-secondary">Current Month</div>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex justify-between items-center bg-surface-container-lowest p-space-md rounded-xl border border-border-light shadow-sm">
              <div className="font-headline-md text-headline-md font-bold text-primary">
                My History
              </div>
              <div className="flex items-center gap-2 border border-border-light rounded-lg px-3 py-2 bg-slate-surface">
                <button className="text-secondary hover:text-primary cursor-pointer">
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <span className="font-label-md text-label-md text-primary font-bold">
                  August 2026
                </span>
                <button className="text-secondary hover:text-primary cursor-pointer">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Employee Data Table */}
            <div className="bg-surface-container-lowest rounded-xl border border-border-light overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-surface border-b border-border-light">
                      <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                        Date
                      </th>
                      <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                        Check In
                      </th>
                      <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                        Check Out
                      </th>
                      <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                        Duration
                      </th>
                      <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-body-md divide-y divide-border-light">
                    {myAttendance.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-secondary font-body-md">
                          No personal attendance logs found.
                        </td>
                      </tr>
                    ) : (
                      myAttendance.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-surface transition-colors"
                        >
                          <td className="px-6 py-4 font-semibold text-primary">
                            {new Date(item.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "2-digit",
                            })}
                          </td>
                          <td className="px-6 py-4 text-secondary">{item.checkIn}</td>
                          <td className="px-6 py-4 text-secondary">{item.checkOut}</td>
                          <td className="px-6 py-4 text-primary font-medium">{item.workHours}</td>
                          <td className="px-6 py-4">
                            {item.status === "Present" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-success-soft text-success-text font-label-sm text-label-sm font-bold">
                                Present
                              </span>
                            )}
                            {item.status === "Late" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-warning-soft text-warning-text font-label-sm text-label-sm font-bold">
                                Late In
                              </span>
                            )}
                            {item.status === "On Leave" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container-low text-secondary font-label-sm text-label-sm font-bold">
                                Approved Leave
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
