"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";

export default function OverviewPage() {
  const router = useRouter();
  const { employees, leaves, auditLogs } = useApp();

  // Compute stats
  const totalEmployees = employees.length;
  const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;

  const handleExport = () => {
    // Simulate log export
    alert("Audit log exported successfully!");
  };

  return (
    <DashboardLayout>
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-space-xl lg:py-space-xxl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-space-xl gap-space-md">
          <div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg gradient-heading font-bold mb-space-xs">
              Overview
            </h2>
            <p className="font-body-md text-body-md text-secondary">
              System administration and audit trail.
            </p>
          </div>
          <div className="flex gap-space-sm w-full md:w-auto">
            <button
              onClick={handleExport}
              className="bg-surface-container-lowest border border-border-light text-slate-700 font-label-md text-label-md px-space-md py-space-sm rounded-lg hover:bg-surface-container-low transition-colors duration-200 flex items-center gap-space-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export Log
            </button>
            <button
              onClick={() => router.push("/employees?add=true")}
              className="bg-ink text-on-primary font-label-md text-label-md px-space-md py-space-sm rounded-lg hover:opacity-90 transition-opacity duration-200 flex items-center gap-space-xs cursor-pointer font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Employee
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-space-md mb-space-xxl">
          {/* Metric Card 1 */}
          <div className="glass-card border border-border-light rounded-xl p-space-lg flex flex-col gap-space-md shadow-sm hover-lift">
            <div className="flex justify-between items-start">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                Total Employees
              </span>
              <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[16px]">groups</span>
              </div>
            </div>
            <div className="font-headline-lg text-headline-lg text-primary font-bold">
              {totalEmployees}
            </div>
            <div className="flex items-center gap-space-xs text-success-text font-label-sm text-label-sm font-bold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>+1 this month</span>
            </div>
          </div>

          {/* Metric Card 2 */}
          <div className="glass-card border border-border-light rounded-xl p-space-lg flex flex-col gap-space-md shadow-sm hover-lift">
            <div className="flex justify-between items-start">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                Active Leave Requests
              </span>
              <div className="w-8 h-8 rounded-full bg-warning-soft flex items-center justify-center text-warning-text">
                <span className="material-symbols-outlined text-[16px]">event_note</span>
              </div>
            </div>
            <div className="font-headline-lg text-headline-lg text-primary font-bold">
              {leaves.length}
            </div>
            <div className="flex items-center gap-space-xs text-warning-text font-label-sm text-label-sm font-bold">
              <span className="material-symbols-outlined text-[14px]">pending_actions</span>
              <span>{pendingLeaves} require approval</span>
            </div>
          </div>

          {/* Metric Card 3 */}
          <div className="glass-card border border-border-light rounded-xl p-space-lg flex flex-col gap-space-md shadow-sm hover-lift">
            <div className="flex justify-between items-start">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                Payroll Status
              </span>
              <div className="w-8 h-8 rounded-full bg-success-soft flex items-center justify-center text-success-text">
                <span className="material-symbols-outlined text-[16px]">payments</span>
              </div>
            </div>
            <div className="font-headline-lg text-headline-lg text-primary font-bold">
              Processed
            </div>
            <div className="flex items-center gap-space-xs text-secondary font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              <span>Next run: Oct 31</span>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop mb-space-xxl">
          {/* Audit Trail */}
          <section className="lg:col-span-8 bg-surface-container-lowest border border-border-light rounded-xl flex flex-col shadow-sm">
            <div className="p-space-lg border-b border-border-light flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md text-primary font-bold">
                Audit Trail
              </h3>
              <button className="text-secondary hover:text-primary transition-colors cursor-pointer">
                <span className="material-symbols-outlined">filter_list</span>
              </button>
            </div>
            <div className="flex-1 p-space-md flex flex-col gap-space-sm overflow-y-auto max-h-[600px]">
              {auditLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-space-xl text-center">
                  <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-secondary mb-space-md">
                    <span className="material-symbols-outlined text-[32px]">history</span>
                  </div>
                  <p className="font-label-md text-label-md text-secondary">
                    No recent activity to display.
                  </p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex gap-space-md p-space-sm hover:bg-slate-surface rounded-lg transition-colors"
                  >
                    <div className="mt-1">
                      <div className="w-2 h-2 rounded-full bg-primary ring-4 ring-surface-container-low mt-2"></div>
                    </div>
                    <div className="flex-1">
                      <p className="font-body-md text-body-md text-primary">
                        <span className="font-semibold">{log.user}</span> {log.action}.
                      </p>
                      <p className="font-label-sm text-label-sm text-secondary mt-1">
                        {log.timestamp} • {log.ipAddress}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-space-sm border-t border-border-light bg-slate-surface rounded-b-xl text-center">
              <button className="font-label-sm text-label-sm text-secondary hover:text-primary transition-colors cursor-pointer">
                View All Logs
              </button>
            </div>
          </section>

          {/* Quick Links & Health */}
          <section className="lg:col-span-4 flex flex-col gap-gutter-desktop">
            {/* Quick Actions */}
            <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-lg shadow-sm">
              <h3 className="font-headline-md text-headline-md text-primary mb-space-lg font-bold">
                Quick Actions
              </h3>
              <div className="flex flex-col gap-space-sm">
                <Link
                  href="/attendance"
                  className="flex items-center gap-space-md p-space-md border border-border-light rounded-lg hover:border-slate-400 hover:bg-slate-surface transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-secondary group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">clinical_notes</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-label-md text-label-md text-primary font-bold">
                      Attendance History
                    </div>
                    <div className="font-label-sm text-label-sm text-secondary">
                      Check-in logs & time audits
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-secondary group-hover:text-primary">
                    chevron_right
                  </span>
                </Link>
                <Link
                  href="/timeoff"
                  className="flex items-center gap-space-md p-space-md border border-border-light rounded-lg hover:border-slate-400 hover:bg-slate-surface transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-secondary group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">event_busy</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-label-md text-label-md text-primary font-bold">
                      Leave Management
                    </div>
                    <div className="font-label-sm text-label-sm text-secondary">
                      Request time off & review queue
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-secondary group-hover:text-primary">
                    chevron_right
                  </span>
                </Link>
                <Link
                  href="/employees"
                  className="flex items-center gap-space-md p-space-md border border-border-light rounded-lg hover:border-slate-400 hover:bg-slate-surface transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-secondary group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">badge</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-label-md text-label-md text-primary font-bold">
                      Employee Directory
                    </div>
                    <div className="font-label-sm text-label-sm text-secondary">
                      Manage staff profiles
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-secondary group-hover:text-primary">
                    chevron_right
                  </span>
                </Link>
              </div>
            </div>

            {/* System Status Card */}
            <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-lg shadow-sm">
              <h3 className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-space-md font-bold">
                System Health
              </h3>
              <div className="flex flex-col gap-space-md">
                <div className="flex justify-between items-center">
                  <span className="font-body-md text-body-md text-primary">API Uptime</span>
                  <span className="font-label-sm text-label-sm text-success-text bg-success-soft px-2 py-1 rounded">
                    99.99%
                  </span>
                </div>
                <div className="w-full bg-surface-container-low h-1 rounded-full overflow-hidden">
                  <div className="bg-success-text h-full" style={{ width: "100%" }}></div>
                </div>
                <div className="flex justify-between items-center mt-space-sm">
                  <span className="font-body-md text-body-md text-primary">Database Load</span>
                  <span className="font-label-sm text-label-sm text-secondary">24%</span>
                </div>
                <div className="w-full bg-surface-container-low h-1 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full" style={{ width: "24%" }}></div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Empty State Area for Future Expansion */}
        <section className="border border-dashed border-border-light rounded-xl bg-slate-surface h-64 flex flex-col items-center justify-center text-center p-space-lg">
          <div className="w-12 h-12 rounded-full bg-surface-container-lowest border border-border-light flex items-center justify-center text-secondary mb-space-md shadow-sm">
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <h4 className="font-headline-md text-headline-md text-primary mb-space-xs font-bold">
            Advanced Analytics Module
          </h4>
          <p className="font-body-md text-body-md text-secondary max-w-md mx-auto">
            This widget area is reserved for the upcoming AI predictive turnover modeling. Enable via system settings.
          </p>
          <button className="mt-space-md bg-surface-container-lowest border border-border-light text-slate-700 font-label-md text-label-md px-space-md py-space-sm rounded-lg hover:bg-surface-container-low transition-colors duration-200 cursor-pointer">
            Configure Widgets
          </button>
        </section>
      </main>
    </DashboardLayout>
  );
}
