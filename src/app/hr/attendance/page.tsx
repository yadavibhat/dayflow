"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";
import { format, parseISO, addDays, subDays, isValid } from "date-fns";
import { computeWorkedDuration, getTodayDateString } from "@/lib/dateUtils";

export default function HRAttendancePage() {
  const { currentRole, attendance, employees } = useApp();

  // State Management
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Security Check: Role must be HR/Admin
  const isAuthorized = currentRole === "admin";

  // Navigation handlers
  const handlePrevDay = () => {
    try {
      const d = parseISO(selectedDate);
      if (isValid(d)) setSelectedDate(format(subDays(d, 1), "yyyy-MM-dd"));
    } catch {
      setSelectedDate(getTodayDateString());
    }
  };

  const handleNextDay = () => {
    try {
      const d = parseISO(selectedDate);
      if (isValid(d)) setSelectedDate(format(addDays(d, 1), "yyyy-MM-dd"));
    } catch {
      setSelectedDate(getTodayDateString());
    }
  };

  const handleToday = () => {
    setSelectedDate(getTodayDateString());
  };

  // Reset pagination when search query or date changes
  useEffect(() => {
    setCurrentPage(1);
    setErrorMessage(null);
  }, [searchQuery, selectedDate, statusFilter]);

  // Query & Filter Data from real context / database
  const filteredData = useMemo(() => {
    if (!isAuthorized) return [];

    return attendance.filter((log) => {
      // Date filter
      const matchesDate = !selectedDate || log.date === selectedDate;

      // Search query filter (employee name or ID)
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        log.employeeName.toLowerCase().includes(q) ||
        log.employeeId.toLowerCase().includes(q);

      // Status filter
      const matchesStatus =
        statusFilter === "All" ||
        log.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesDate && matchesSearch && matchesStatus;
    });
  }, [attendance, selectedDate, searchQuery, statusFilter, isAuthorized]);

  // Paginated records
  const totalCount = filteredData.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Employee ID",
      "Employee Name",
      "Department",
      "Date",
      "Check In Time",
      "Check Out Time",
      "Total Worked Hours",
      "Extra Overtime Hours",
      "Status",
    ];
    const rows = filteredData.map((row) => [
      `"${row.employeeId}"`,
      `"${row.employeeName}"`,
      `"${(row as any).department || "General"}"`,
      `"${row.date}"`,
      `"${row.checkIn && row.checkIn !== "--:--" ? row.checkIn : "Not Checked In"}"`,
      `"${row.checkOut && row.checkOut !== "--:--" ? row.checkOut : "Not Checked Out"}"`,
      `"${row.workHours && row.workHours !== "--" ? row.workHours : "0h 0m"}"`,
      `"${row.extraHours && row.extraHours !== "--" ? row.extraHours : "0h 0m"}"`,
      `"${row.status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Dayflow_HR_Attendance_${selectedDate || "all"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. UNAUTHORIZED ACCESS STATE (CRITICAL SECURITY GUARD)
  if (!isAuthorized) {
    return (
      <DashboardLayout>
        <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-space-xl">
          <div className="bg-surface-container-lowest border border-rose-200 rounded-2xl p-8 max-w-lg mx-auto shadow-sm text-center">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
              403 — HR Authorization Required
            </h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              You are currently signed in as an <strong>Employee</strong>. Organization-wide attendance audits and employee logs are restricted to HR/Admin roles.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/attendance"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all text-center"
              >
                Go to My Attendance
              </Link>
              <Link
                href="/"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-all text-center"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-space-xl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-space-md mb-space-lg">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold rounded-md uppercase tracking-wider">
                HR / Admin Portal
              </span>
            </div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold tracking-tight">
              Organization Attendance
            </h1>
            <p className="font-body-md text-body-md text-secondary mt-0.5">
              Daily check-in logs, calculated work hours, and live employee punch status.
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={filteredData.length === 0}
              className="px-3.5 py-2 bg-surface-container-lowest border border-border-light rounded-lg text-secondary font-label-md text-label-md hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 disabled:pointer-events-none"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export CSV
            </button>
            <Link
              href="/attendance"
              className="px-3.5 py-2 bg-surface-container-low hover:bg-surface-container-high text-primary border border-border-light rounded-lg font-label-md text-label-md transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
              My View
            </Link>
          </div>
        </div>

        {/* Filter & Date Pagination Toolbar */}
        <div className="flex flex-col lg:flex-row justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl border border-border-light shadow-sm mb-space-md">
          {/* Search and Status Filters */}
          <div className="flex flex-wrap items-center gap-space-sm flex-1">
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">
                search
              </span>
              <input
                type="text"
                placeholder="Search employee name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-border-light rounded-lg text-sm text-primary focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-secondary">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-surface-container-lowest border border-border-light rounded-lg text-xs font-semibold text-primary focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          {/* Stitch Date Navigation Control */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-border-light rounded-lg px-2 py-1.5 bg-surface-container-low shadow-sm">
              <button
                onClick={handlePrevDay}
                className="p-1 text-secondary hover:text-primary hover:bg-surface-container-lowest rounded transition-colors cursor-pointer"
                title="Previous Day"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>

              <span className="font-label-md text-xs font-bold text-primary px-2 min-w-[120px] text-center whitespace-nowrap">
                {selectedDate
                  ? format(parseISO(selectedDate), "EEE, dd MMM yyyy")
                  : "All Dates"}
              </span>

              <button
                onClick={handleNextDay}
                className="p-1 text-secondary hover:text-primary hover:bg-surface-container-lowest rounded transition-colors cursor-pointer"
                title="Next Day"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>

            <button
              onClick={handleToday}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                selectedDate === getTodayDateString()
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface-container-lowest border-border-light text-secondary hover:text-primary"
              }`}
            >
              Today
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1.5 text-xs font-medium border border-border-light rounded-lg bg-surface-container-lowest text-primary focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* ERROR STATE */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center justify-between mb-space-md shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="material-symbols-outlined text-rose-600">error</span>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-md transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING SKELETON STATE */}
        {loading ? (
          <div className="bg-surface-container-lowest rounded-xl border border-border-light p-6 shadow-sm animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/4"></div>
            <div className="h-10 bg-slate-100 rounded w-full"></div>
            <div className="h-10 bg-slate-100 rounded w-full"></div>
            <div className="h-10 bg-slate-100 rounded w-full"></div>
          </div>
        ) : (
          /* POPULATED DATA TABLE */
          <div className="bg-surface-container-lowest rounded-xl border border-border-light overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-surface border-b border-border-light">
                    <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                      Employee
                    </th>
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
                  {/* EMPTY STATE */}
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                            <span className="material-symbols-outlined text-2xl">event_busy</span>
                          </div>
                          <h4 className="font-headline-md text-base font-bold text-primary">
                            No attendance recorded for this date
                          </h4>
                          <p className="font-body-md text-xs text-secondary leading-relaxed">
                            {searchQuery
                              ? `No employee records match the search query "${searchQuery}".`
                              : `There are no check-in logs submitted for ${
                                  selectedDate
                                    ? format(parseISO(selectedDate), "MMMM dd, yyyy")
                                    : "the selected period"
                                }.`}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-surface/60 transition-colors"
                      >
                        <td className="px-6 py-3.5 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {item.employeeName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <span className="font-semibold text-primary block text-sm">
                              {item.employeeName}
                            </span>
                            <span className="text-[11px] text-secondary font-mono">
                              ID: {item.employeeId}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-secondary text-xs font-medium font-mono">
                          {item.date}
                        </td>
                        <td className="px-6 py-3.5 text-secondary font-mono text-xs">
                          {item.checkIn}
                        </td>
                        <td className="px-6 py-3.5 text-secondary font-mono text-xs">
                          {item.checkOut}
                        </td>
                        <td className="px-6 py-3.5 text-primary font-medium text-xs">
                          {item.workHours}
                        </td>
                        <td className="px-6 py-3.5 text-secondary font-mono text-xs">
                          {item.extraHours}
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              item.status === "Present"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : item.status === "Late"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Toolbar */}
            {totalCount > 0 && (
              <div className="border-t border-border-light px-6 py-3 flex items-center justify-between bg-surface-container-lowest">
                <div className="font-label-md text-xs text-secondary">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 border border-border-light rounded-md text-xs text-secondary hover:bg-surface-container-low disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    Previous
                  </button>

                  <span className="px-3 py-1 text-xs font-bold text-primary">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-2.5 py-1 border border-border-light rounded-md text-xs text-secondary hover:bg-surface-container-low disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
