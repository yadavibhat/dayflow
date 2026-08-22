"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";

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
          <StatCard
            title="Total Employees"
            value={totalEmployees}
            icon="groups"
            trendText="+1 this month"
            trendDirection="up"
          />

          <StatCard
            title="Active Leave Requests"
            value={leaves.length}
            icon="event_note"
            iconBgClass="bg-warning-soft text-warning-text"
            trendText={`${pendingLeaves} require approval`}
            trendDirection={pendingLeaves > 0 ? "down" : "neutral"}
            trendIcon="pending_actions"
          />

          <StatCard
            title="Payroll Status"
            value="Processed"
            icon="payments"
            iconBgClass="bg-success-soft text-success-text"
            trendText="Next run: Oct 31"
            trendDirection="neutral"
            trendIcon="check_circle"
          />
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop mb-space-xxl">
          {/* Audit Trail */}
          <section className="lg:col-span-8 flex flex-col">
            <Card
              title="Audit Trail"
              action={
                <button className="text-secondary hover:text-primary transition-colors cursor-pointer">
                  <span className="material-symbols-outlined">filter_list</span>
                </button>
              }
              className="flex-1 bg-surface-container-lowest border border-border-light shadow-sm"
              glass={false}
            >
              <div className="flex-1 flex flex-col gap-space-sm overflow-y-auto max-h-[600px] mt-2">
                {auditLogs.length === 0 ? (
                  <EmptyState
                    icon="history"
                    title="No recent activity to display"
                    description="When events occur, they will appear in this audit log list."
                  />
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
              <div className="p-space-sm border-t border-border-light bg-slate-surface rounded-b-xl text-center -mx-space-lg -mb-space-lg mt-space-md">
                <button className="font-label-sm text-label-sm text-secondary hover:text-primary transition-colors cursor-pointer">
                  View All Logs
                </button>
              </div>
            </Card>
          </section>

          {/* Quick Links & Health */}
          <section className="lg:col-span-4 flex flex-col gap-gutter-desktop">
            {/* Quick Actions */}
            <Card title="Quick Actions" glass={false} className="bg-surface-container-lowest border border-border-light shadow-sm">
              <div className="flex flex-col gap-space-sm mt-2">
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
                <Link
                  href="/payroll/1"
                  className="flex items-center gap-space-md p-space-md border border-border-light rounded-lg hover:border-slate-400 hover:bg-slate-surface transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-secondary group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">settings_applications</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-label-md text-label-md text-primary font-bold">
                      Payroll Settings
                    </div>
                    <div className="font-label-sm text-label-sm text-secondary">
                      Configure tax & cycles
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-secondary group-hover:text-primary">
                    chevron_right
                  </span>
                </Link>
              </div>
            </Card>

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
        <section className="border border-dashed border-border-light rounded-xl bg-slate-surface p-space-lg">
          <EmptyState
            icon="analytics"
            title="Advanced Analytics Module"
            description="This widget area is reserved for the upcoming AI predictive turnover modeling. Enable via system settings."
            actionLabel="Configure Widgets"
            onAction={() => alert("Widget configuration options coming soon!")}
          />
        </section>
      </main>
    </DashboardLayout>
  );
}
