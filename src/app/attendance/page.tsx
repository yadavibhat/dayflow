"use client";

import React, { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWeekend,
  isSameMonth,
  addMonths,
  subMonths,
  endOfWeek,
  eachWeekOfInterval,
} from "date-fns";
import {
  deriveDailyAttendanceStatus,
  calculateEmployeeAttendanceSummary,
} from "@/services/attendanceService";

export default function AttendancePage() {
  const { attendance, currentUser, leaves, currentRole } = useApp();
  const [viewType, setViewType] = useState<"admin" | "employee">(currentRole === "admin" ? "admin" : "employee");
  const [breakdownType, setBreakdownType] = useState<"daily" | "weekly">("daily");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedAdminDate, setSelectedAdminDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  // Month navigation handlers
  const handlePrevMonth = () => setSelectedMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedMonth((prev) => addMonths(prev, 1));
  const handleResetMonth = () => setSelectedMonth(new Date());

  // 1. DATA ACCESS: Scoped strictly to authenticated employee for Employee View
  const myRawAttendance = useMemo(() => {
    return attendance.filter((a) => a.employeeId === currentUser.id);
  }, [attendance, currentUser.id]);

  const myApprovedLeaves = useMemo(() => {
    return leaves.filter((l) => l.employeeId === currentUser.id && l.status === "Approved");
  }, [leaves, currentUser.id]);

  // 2. DAILY BREAKDOWN CALCULATION FOR SELECTED MONTH
  const monthDays = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    return eachDayOfInterval({ start, end });
  }, [selectedMonth]);

  const dailyHistory = useMemo(() => {
    return monthDays.map((dayDate) => {
      const dateStr = format(dayDate, "yyyy-MM-dd");
      const record = myRawAttendance.find((a) => a.date === dateStr);
      const derived = deriveDailyAttendanceStatus(dayDate, record, myApprovedLeaves);

      return {
        date: dateStr,
        dayDate,
        formattedDate: format(dayDate, "EEE, dd MMM yyyy"),
        isWeekend: isWeekend(dayDate),
        ...derived,
      };
    }).reverse();
  }, [monthDays, myRawAttendance, myApprovedLeaves]);

  // 3. SUMMARY METRICS COMPUTED FROM REAL DERIVED STATUSES
  const summary = useMemo(() => {
    return calculateEmployeeAttendanceSummary(selectedMonth, myRawAttendance, myApprovedLeaves);
  }, [selectedMonth, myRawAttendance, myApprovedLeaves]);

  // 4. WEEKLY BREAKDOWN GROUPING
  const weeklyHistory = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });

    return weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

      let presentCount = 0;
      let hoursMins = 0;
      let leaveCount = 0;
      let absentCount = 0;

      const dayBreakdowns = daysInWeek.map((dayDate) => {
        const dateStr = format(dayDate, "yyyy-MM-dd");
        const record = myRawAttendance.find((a) => a.date === dateStr);
        const derived = deriveDailyAttendanceStatus(dayDate, record, myApprovedLeaves);

        if (derived.status === "Present" || derived.status === "Late") presentCount++;
        if (derived.status === "Leave") leaveCount++;
        if (derived.status === "Absent") absentCount++;

        if (derived.workHours && derived.workHours !== "--") {
          const match = derived.workHours.match(/(\d+)h\s*(\d*)m?/);
          if (match) {
            hoursMins += parseInt(match[1] || "0") * 60 + parseInt(match[2] || "0");
          }
        }

        return {
          dateStr,
          dayDate,
          isWeekend: isWeekend(dayDate),
          isCurrentMonth: isSameMonth(dayDate, selectedMonth),
          ...derived,
        };
      });

      const totalWeekHours = `${Math.floor(hoursMins / 60)}h ${hoursMins % 60}m`;

      return {
        weekLabel: `${format(weekStart, "dd MMM")} - ${format(weekEnd, "dd MMM yyyy")}`,
        presentCount,
        leaveCount,
        absentCount,
        totalWeekHours,
        dayBreakdowns,
      };
    }).reverse();
  }, [selectedMonth, myRawAttendance, myApprovedLeaves]);

  // 5. ADMIN OVERVIEW LOGS (All Employees)
  const adminFilteredAttendance = useMemo(() => {
    return attendance.filter((item) => {
      const matchesSearch =
        item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || item.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesDate = !selectedAdminDate || item.date === selectedAdminDate;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [attendance, searchQuery, statusFilter, selectedAdminDate]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ["Employee ID", "Employee Name", "Date", "Check In", "Check Out", "Work Hours", "Extra Hours", "Status"];
    const rows = (viewType === "admin" ? adminFilteredAttendance : dailyHistory).map((row: any) => [
      row.employeeId || currentUser.id,
      row.employeeName || currentUser.name,
      row.date,
      row.checkIn,
      row.checkOut,
      row.workHours,
      row.extraHours,
      row.status,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Dayflow_Attendance_${viewType}_${format(selectedMonth, "yyyy_MM")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-space-xl">
        {/* Page Header & View Switcher */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-space-md mb-space-lg">
          <div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold tracking-tight">
              Attendance Management &amp; History
            </h1>
            <p className="font-body-md text-body-md text-secondary mt-1">
              Real-time time tracking, daily audits, and verified work hours.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-surface-container-lowest border border-border-light rounded-lg text-secondary font-label-md text-label-md hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              title="Export records to CSV"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export CSV
            </button>

            {/* View Switcher: HR vs Employee */}
            <div className="flex p-1 bg-surface-container-low rounded-lg border border-border-light shadow-sm">
              <button
                className={`px-4 py-1.5 font-label-md text-label-md rounded-md transition-all cursor-pointer ${
                  viewType === "employee"
                    ? "bg-surface-container-lowest shadow-sm border border-border-light text-primary font-bold"
                    : "text-secondary hover:text-primary font-medium"
                }`}
                onClick={() => setViewType("employee")}
              >
                My Attendance
              </button>
              <button
                className={`px-4 py-1.5 font-label-md text-label-md rounded-md transition-all cursor-pointer ${
                  viewType === "admin"
                    ? "bg-surface-container-lowest shadow-sm border border-border-light text-primary font-bold"
                    : "text-secondary hover:text-primary font-medium"
                }`}
                onClick={() => setViewType("admin")}
              >
                All Employees (HR)
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================
            EMPLOYEE ATTENDANCE VIEW (SCOPED TO CURRENT USER)
        ================================================== */}
        {viewType === "employee" && (
          <div className="flex flex-col gap-space-lg w-full">
            {/* Live Summary KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
              <div className="bg-surface-container-lowest p-space-md rounded-xl border border-border-light flex flex-col justify-between shadow-sm">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                  Days Present
                </span>
                <div className="font-headline-lg text-3xl font-black text-emerald-600 mt-2">
                  {summary.daysPresent}
                </div>
                <div className="font-label-sm text-xs text-secondary mt-1">
                  {summary.daysLate > 0 ? `(${summary.daysLate} late check-in)` : "100% on time"}
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-md rounded-xl border border-border-light flex flex-col justify-between shadow-sm">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                  Approved Leaves
                </span>
                <div className="font-headline-lg text-3xl font-black text-blue-600 mt-2">
                  {summary.daysLeave}
                </div>
                <div className="font-label-sm text-xs text-secondary mt-1">Authorized time off</div>
              </div>

              <div className="bg-surface-container-lowest p-space-md rounded-xl border border-border-light flex flex-col justify-between shadow-sm">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                  Total Working Days
                </span>
                <div className="font-headline-lg text-3xl font-black text-primary mt-2">
                  {summary.totalWorkingDays}
                </div>
                <div className="font-label-sm text-xs text-secondary mt-1">
                  Excludes weekends
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-md rounded-xl border border-border-light flex flex-col justify-between shadow-sm">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                  Total Hours Logged
                </span>
                <div className="font-headline-lg text-3xl font-black text-indigo-600 mt-2">
                  {summary.totalHours}
                </div>
                <div className="font-label-sm text-xs text-secondary mt-1">
                  Selected period total
                </div>
              </div>
            </div>

            {/* Controls Bar: Breakdown Toggle & Month Navigator */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-space-md bg-surface-container-lowest p-space-md rounded-xl border border-border-light shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex p-1 bg-surface-container-low rounded-lg border border-border-light">
                  <button
                    onClick={() => setBreakdownType("daily")}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      breakdownType === "daily"
                        ? "bg-surface-container-lowest text-primary shadow-sm"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    Daily Log
                  </button>
                  <button
                    onClick={() => setBreakdownType("weekly")}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      breakdownType === "weekly"
                        ? "bg-surface-container-lowest text-primary shadow-sm"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    Weekly Summary
                  </button>
                </div>
              </div>

              {/* Month Navigator */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 border border-border-light rounded-lg px-2 py-1.5 bg-surface-container-low shadow-sm">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 text-secondary hover:text-primary hover:bg-surface-container-lowest rounded transition-colors cursor-pointer"
                    title="Previous Month"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <span className="font-label-md text-label-md text-primary font-bold px-2 whitespace-nowrap">
                    {format(selectedMonth, "MMMM yyyy")}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 text-secondary hover:text-primary hover:bg-surface-container-lowest rounded transition-colors cursor-pointer"
                    title="Next Month"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
                <button
                  onClick={handleResetMonth}
                  className="px-2.5 py-1.5 text-xs font-semibold text-secondary hover:text-primary border border-border-light rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  Current
                </button>
              </div>
            </div>

            {/* DAILY BREAKDOWN TABLE */}
            {breakdownType === "daily" && (
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
                          Worked Hours
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
                      {dailyHistory.map((item) => (
                        <tr
                          key={item.date}
                          className={`hover:bg-slate-surface/60 transition-colors ${
                            item.isWeekend ? "bg-slate-50/40 opacity-70" : ""
                          }`}
                        >
                          <td className="px-6 py-3.5 font-semibold text-primary">
                            {item.formattedDate}
                          </td>
                          <td className="px-6 py-3.5 text-secondary font-mono text-xs">
                            {item.checkIn}
                          </td>
                          <td className="px-6 py-3.5 text-secondary font-mono text-xs">
                            {item.checkOut}
                          </td>
                          <td className="px-6 py-3.5 text-primary font-medium">
                            {item.workHours}
                          </td>
                          <td className="px-6 py-3.5 text-secondary font-mono text-xs">
                            {item.extraHours}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${item.badgeClass}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* WEEKLY BREAKDOWN VIEW */}
            {breakdownType === "weekly" && (
              <div className="flex flex-col gap-space-md">
                {weeklyHistory.map((week, idx) => (
                  <div
                    key={idx}
                    className="bg-surface-container-lowest rounded-xl border border-border-light p-space-md shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-border-light gap-2">
                      <div>
                        <span className="font-headline-md text-sm font-bold text-primary">
                          Week {weeklyHistory.length - idx}: {week.weekLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-emerald-700 font-bold">
                          {week.presentCount} Days Present
                        </span>
                        <span className="text-secondary font-medium">
                          {week.totalWeekHours} Logged
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                      {week.dayBreakdowns.map((day) => (
                        <div
                          key={day.dateStr}
                          className={`p-2.5 rounded-lg border flex flex-col justify-between min-h-[72px] ${
                            day.isWeekend
                              ? "bg-slate-50 border-slate-200 opacity-60"
                              : "bg-surface-container-lowest border-border-light"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-secondary">
                              {format(day.dayDate, "EEE d")}
                            </span>
                            <span className={`h-2 w-2 rounded-full ${
                              day.status === "Present" || day.status === "Late"
                                ? "bg-emerald-500"
                                : day.status === "Leave"
                                ? "bg-blue-500"
                                : day.status === "Half-day"
                                ? "bg-purple-500"
                                : day.status === "Absent"
                                ? "bg-rose-500"
                                : "bg-slate-300"
                            }`}></span>
                          </div>
                          <div className="mt-2 flex flex-col">
                            <span className="text-[11px] font-bold text-primary truncate">
                              {day.status}
                            </span>
                            <span className="text-[10px] text-secondary font-mono">
                              {day.workHours !== "--" ? day.workHours : "—"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================
            HR / ADMIN ALL EMPLOYEES ATTENDANCE OVERVIEW
        ================================================== */}
        {viewType === "admin" && (
          <div className="flex flex-col gap-space-lg w-full">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl border border-border-light shadow-sm">
              <div className="flex flex-wrap items-center gap-space-sm w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">
                    search
                  </span>
                  <input
                    className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-border-light rounded-lg font-body-md text-sm focus:outline-none focus:border-primary text-primary transition-colors"
                    placeholder="Search by name or ID..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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

              {/* Date Selector for Admin View */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-secondary">Date:</span>
                <input
                  type="date"
                  value={selectedAdminDate}
                  onChange={(e) => setSelectedAdminDate(e.target.value)}
                  className="px-3 py-1.5 border border-border-light rounded-lg text-xs font-semibold text-primary bg-surface-container-lowest focus:outline-none cursor-pointer"
                />
                {selectedAdminDate && (
                  <button
                    onClick={() => setSelectedAdminDate("")}
                    className="text-xs text-secondary hover:text-primary underline cursor-pointer"
                  >
                    All Dates
                  </button>
                )}
              </div>
            </div>

            {/* Admin Table */}
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
                    {adminFilteredAttendance.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-4xl text-slate-300">
                              event_busy
                            </span>
                            <p className="font-headline-md text-sm font-semibold text-primary">
                              No attendance records match your filter criteria
                            </p>
                            <p className="font-body-md text-xs text-secondary max-w-sm">
                              Records will appear here as employees check in and check out through the systray control.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      adminFilteredAttendance.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-surface transition-colors"
                        >
                          <td className="px-6 py-3.5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {item.employeeName.split(" ").map((n) => n[0]).join("")}
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
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
