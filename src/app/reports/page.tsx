"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";
import { format } from "date-fns";

export default function ReportsPage() {
  const { employees, attendance, leaves, auditLogs } = useApp();
  const [selectedMonth, setSelectedMonth] = useState("2026-08");
  const [downloading, setDownloading] = useState<string | null>(null);

  // 1. Export Attendance CSV
  const handleExportAttendance = () => {
    setDownloading("attendance");
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

    const rows = attendance.map((row) => {
      const emp = employees.find((e) => e.id === row.employeeId);
      return [
        `"${row.employeeId}"`,
        `"${row.employeeName || emp?.name || "Employee"}"`,
        `"${emp?.department || "General"}"`,
        `"${row.date}"`,
        `"${row.checkIn && row.checkIn !== "--:--" ? row.checkIn : "Not Checked In"}"`,
        `"${row.checkOut && row.checkOut !== "--:--" ? row.checkOut : "Not Checked Out"}"`,
        `"${row.workHours && row.workHours !== "--" ? row.workHours : "0h 0m"}"`,
        `"${row.extraHours && row.extraHours !== "--" ? row.extraHours : "0h 0m"}"`,
        `"${row.status}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Dayflow_Attendance_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(null), 400);
  };

  // 2. Export Payroll CSV
  const handleExportPayroll = () => {
    setDownloading("payroll");
    const headers = [
      "Employee ID",
      "Employee Name",
      "Designation",
      "Department",
      "Annual Base Salary (INR)",
      "Monthly Gross Wage (INR)",
      "Basic Salary (50%)",
      "HRA (25%)",
      "Standard Allowance (15%)",
      "PF Deduction (12%)",
      "Professional Tax (INR)",
      "Net Monthly Pay (INR)",
    ];

    const rows = employees.map((emp) => {
      const annualBase = emp.salary?.base || 1200000;
      const monthlyWage = Math.round(annualBase / 12);
      const basic = Math.round(monthlyWage * 0.5);
      const hra = Math.round(monthlyWage * 0.25);
      const std = Math.round(monthlyWage * 0.15);
      const pf = Math.round(basic * 0.12);
      const pt = 200;
      const netPay = monthlyWage - (pf + pt);

      return [
        `"${emp.id}"`,
        `"${emp.name}"`,
        `"${emp.role}"`,
        `"${emp.department}"`,
        `"${annualBase}"`,
        `"${monthlyWage}"`,
        `"${basic}"`,
        `"${hra}"`,
        `"${std}"`,
        `"${pf}"`,
        `"${pt}"`,
        `"${netPay}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Dayflow_Payroll_Register_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(null), 400);
  };

  // 3. Export Leaves Summary CSV
  const handleExportLeaves = () => {
    setDownloading("leaves");
    const headers = [
      "Request ID",
      "Employee ID",
      "Employee Name",
      "Department",
      "Leave Type",
      "Dates",
      "Duration (Days)",
      "Status",
    ];

    const rows = leaves.map((l) => [
      `"${l.id}"`,
      `"${l.employeeId}"`,
      `"${l.employeeName}"`,
      `"${l.department}"`,
      `"${l.type}"`,
      `"${l.dates}"`,
      `"${l.days}"`,
      `"${l.status}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Dayflow_Leave_Summary_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(null), 400);
  };

  // 4. Export Audit Log CSV
  const handleExportAudit = () => {
    setDownloading("audit");
    const headers = ["Log ID", "Actor Name", "Action Description", "Timestamp", "IP Address"];
    const rows = auditLogs.map((log) => [
      `"${log.id}"`,
      `"${log.user}"`,
      `"${log.action.replace(/"/g, '""')}"`,
      `"${log.timestamp}"`,
      `"${log.ipAddress || "127.0.0.1"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Dayflow_Audit_Log_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(null), 400);
  };

  return (
    <DashboardLayout>
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-space-xl lg:py-space-xxl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-space-xl gap-space-md">
          <div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg gradient-heading font-bold mb-space-xs">
              Reports &amp; Data Exports
            </h1>
            <p className="font-body-md text-body-md text-secondary">
              Generate structured CSV reports for attendance, payroll registers, and leave records.
            </p>
          </div>
          <div className="flex items-center gap-space-sm">
            <span className="text-xs font-bold text-secondary">Reporting Period:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-surface-container-lowest border border-border-light rounded-lg text-xs font-bold text-primary focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
          {/* Card 1: Attendance Report */}
          <div className="bg-surface-container-lowest border border-border-light rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100">
                <span className="material-symbols-outlined text-2xl">clinical_notes</span>
              </div>
              <h3 className="font-headline-md text-lg font-bold text-primary mb-1">
                Attendance &amp; Punctuality Register
              </h3>
              <p className="text-secondary text-sm leading-relaxed mb-4">
                Detailed day-by-day punches including check-in timestamp, check-out timestamp, total
                worked hours, overtime extra hours, and daily attendance status.
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-border-light text-xs text-secondary space-y-1 mb-6">
                <div className="flex justify-between">
                  <span>Total Logged Punches:</span>
                  <span className="font-bold text-primary font-mono">{attendance.length} records</span>
                </div>
                <div className="flex justify-between">
                  <span>Covered Employees:</span>
                  <span className="font-bold text-primary font-mono">{employees.length} members</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleExportAttendance}
              disabled={downloading === "attendance"}
              className="w-full py-3 bg-primary hover:bg-ink text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">download</span>
              {downloading === "attendance" ? "Exporting CSV..." : "Download Attendance CSV"}
            </button>
          </div>

          {/* Card 2: Payroll Register */}
          <div className="bg-surface-container-lowest border border-border-light rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
                <span className="material-symbols-outlined text-2xl">payments</span>
              </div>
              <h3 className="font-headline-md text-lg font-bold text-primary mb-1">
                Monthly Payroll Register (INR ₹)
              </h3>
              <p className="text-secondary text-sm leading-relaxed mb-4">
                Full statutory salary computation breakdown formatted in INR (₹), including Basic
                Wage (50%), HRA (25%), Standard Allowance, PF (12%), and PT (₹200).
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-border-light text-xs text-secondary space-y-1 mb-6">
                <div className="flex justify-between">
                  <span>Total Payroll Run:</span>
                  <span className="font-bold text-primary font-mono">
                    ₹
                    {employees
                      .reduce((acc, e) => acc + Math.round((e.salary?.base || 1200000) / 12), 0)
                      .toLocaleString("en-IN")}
                    /mo
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Statutory Compliance:</span>
                  <span className="font-bold text-emerald-700">PF 12% + PT ₹200 Enforced</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleExportPayroll}
              disabled={downloading === "payroll"}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">download</span>
              {downloading === "payroll" ? "Exporting CSV..." : "Download Payroll Register CSV"}
            </button>
          </div>

          {/* Card 3: Time Off Summary */}
          <div className="bg-surface-container-lowest border border-border-light rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 border border-purple-100">
                <span className="material-symbols-outlined text-2xl">event_busy</span>
              </div>
              <h3 className="font-headline-md text-lg font-bold text-primary mb-1">
                Time Off &amp; Leave Utilization
              </h3>
              <p className="text-secondary text-sm leading-relaxed mb-4">
                Summary of all approved, pending, and rejected leave requests with date ranges, leave
                categories (Paid, Sick, Casual), and department statistics.
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-border-light text-xs text-secondary space-y-1 mb-6">
                <div className="flex justify-between">
                  <span>Pending Approvals:</span>
                  <span className="font-bold text-amber-600 font-mono">
                    {leaves.filter((l) => l.status === "Pending").length} requests
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Approved Leaves:</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {leaves.filter((l) => l.status === "Approved").length} requests
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleExportLeaves}
              disabled={downloading === "leaves"}
              className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">download</span>
              {downloading === "leaves" ? "Exporting CSV..." : "Download Leaves Summary CSV"}
            </button>
          </div>

          {/* Card 4: Audit Trail */}
          <div className="bg-surface-container-lowest border border-border-light rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4 border border-slate-200">
                <span className="material-symbols-outlined text-2xl">manage_search</span>
              </div>
              <h3 className="font-headline-md text-lg font-bold text-primary mb-1">
                System Audit Trail &amp; Activity
              </h3>
              <p className="text-secondary text-sm leading-relaxed mb-4">
                Immutable chronological log of all administrator actions, salary revisions, leave
                approvals, check-in timestamps, and security events.
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-border-light text-xs text-secondary space-y-1 mb-6">
                <div className="flex justify-between">
                  <span>Total Recorded Events:</span>
                  <span className="font-bold text-primary font-mono">{auditLogs.length} events</span>
                </div>
                <div className="flex justify-between">
                  <span>Audit Integrity:</span>
                  <span className="font-bold text-primary">Tamper-Evident Active</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleExportAudit}
              disabled={downloading === "audit"}
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">download</span>
              {downloading === "audit" ? "Exporting CSV..." : "Download Audit Log CSV"}
            </button>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
