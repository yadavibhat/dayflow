"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";

// ─── helpers ─────────────────────────────────────────────────────────────────

const CATEGORIES = ["ALL", "ATTENDANCE", "LEAVE", "PAYROLL", "PROFILE", "AUTH", "SYSTEM"] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

function inferCategory(action: string): { category: CategoryFilter; icon: string; color: string } {
  const a = action.toLowerCase();
  if (a.includes("check") || a.includes("attendance")) {
    return { category: "ATTENDANCE", icon: "clinical_notes", color: "text-blue-600 bg-blue-50" };
  }
  if (a.includes("leave") || a.includes("request")) {
    return { category: "LEAVE", icon: "event_busy", color: "text-purple-600 bg-purple-50" };
  }
  if (a.includes("salary") || a.includes("payroll") || a.includes("ctc")) {
    return { category: "PAYROLL", icon: "payments", color: "text-green-600 bg-green-50" };
  }
  if (a.includes("profile") || a.includes("updated") || a.includes("created")) {
    return { category: "PROFILE", icon: "person", color: "text-orange-600 bg-orange-50" };
  }
  if (a.includes("sign") || a.includes("login") || a.includes("logout")) {
    return { category: "AUTH", icon: "lock", color: "text-red-600 bg-red-50" };
  }
  return { category: "SYSTEM", icon: "settings", color: "text-secondary bg-surface-container-low" };
}

function Badge({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "neutral" | "info" | "purple";
}) {
  const cls = {
    success: "bg-success-soft text-success-text border-success-text/10",
    warning: "bg-warning-soft text-warning-text border-warning-text/10",
    danger: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-surface-container-low text-secondary border-border-light",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  }[variant];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${cls}`}>
      {children}
    </span>
  );
}

function categoryBadgeVariant(cat: CategoryFilter) {
  const map: Record<CategoryFilter, "success" | "warning" | "danger" | "neutral" | "info" | "purple"> = {
    ALL: "neutral",
    ATTENDANCE: "info",
    LEAVE: "purple",
    PAYROLL: "success",
    PROFILE: "warning",
    AUTH: "danger",
    SYSTEM: "neutral",
  };
  return map[cat];
}

function formatTimestamp(ts: string): string {
  if (!ts || ts === "Just now") return ts;
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return ts;
  }
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function HRAuditPage() {
  const router = useRouter();
  const { auditLogs, leaves, currentRole } = useApp();

  // Role guard
  if (currentRole !== "admin") {
    router.replace("/dashboard");
    return null;
  }

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("ALL");

  const pendingLeaveCount = leaves.filter((l) => l.status === "Pending").length;

  const enrichedLogs = useMemo(() => {
    return auditLogs.map((log) => ({
      ...log,
      ...inferCategory(log.action),
    }));
  }, [auditLogs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enrichedLogs.filter((log) => {
      const matchCat = activeCategory === "ALL" || log.category === activeCategory;
      const matchSearch =
        !q ||
        log.user?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.ipAddress?.includes(q);
      return matchCat && matchSearch;
    });
  }, [enrichedLogs, activeCategory, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: auditLogs.length };
    CATEGORIES.forEach((cat) => {
      if (cat !== "ALL") {
        c[cat] = enrichedLogs.filter((l) => l.category === cat).length;
      }
    });
    return c;
  }, [enrichedLogs, auditLogs.length]);

  return (
    <DashboardLayout>
      <main className="flex-1 p-gutter-mobile lg:p-gutter-desktop max-w-container-max mx-auto w-full">
        <div className="max-w-5xl mx-auto space-y-space-xl">

          {/* Page Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-1 font-bold">
                HR Administration
              </p>
              <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Audit Trail</h1>
              <p className="font-body-md text-body-md text-secondary mt-1">
                Read-only chronological log of all system and user actions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {pendingLeaveCount > 0 && (
                <div className="flex items-center gap-2 bg-warning-soft border border-warning-text/10 rounded-xl px-4 py-2">
                  <span className="material-symbols-outlined text-warning-text text-[16px]">pending_actions</span>
                  <span className="font-label-md text-label-md text-warning-text font-bold">
                    {pendingLeaveCount} leave{pendingLeaveCount !== 1 ? "s" : ""} pending
                  </span>
                </div>
              )}
              <Badge variant="neutral">{auditLogs.length} total events</Badge>
            </div>
          </div>

          {/* Search + Filter Bar */}
          <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-md shadow-sm space-y-space-md">
            {/* Search */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-[18px]">search</span>
              <input
                className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-border-light rounded-lg font-body-md text-body-md text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="Search by actor, action, or IP…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search audit logs"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold uppercase tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    activeCategory === cat
                      ? "bg-ink text-on-primary shadow-sm"
                      : "bg-surface-container-low text-secondary hover:bg-surface-container-high hover:text-primary"
                  }`}
                  aria-pressed={activeCategory === cat}
                >
                  {cat}
                  {counts[cat] !== undefined && counts[cat] > 0 && (
                    <span className={`text-[10px] font-black px-1.5 rounded-full ${activeCategory === cat ? "bg-white/20" : "bg-border-light"}`}>
                      {counts[cat]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Event List */}
          {filtered.length === 0 ? (
            <div className="bg-surface-container-lowest border border-dashed border-border-light rounded-xl p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-secondary mb-3 block">manage_search</span>
              <h3 className="font-headline-md text-headline-md text-primary font-bold mb-2">No Events Found</h3>
              <p className="font-body-md text-body-md text-secondary">
                {search ? `No audit events match "${search}"` : `No events in the ${activeCategory} category yet.`}
              </p>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden shadow-sm">
              <div className="px-space-md py-4 border-b border-border-light bg-surface-container-low/50 flex items-center justify-between">
                <h2 className="font-headline-md text-headline-md text-primary font-bold">
                  {activeCategory === "ALL" ? "All Events" : `${activeCategory} Events`}
                </h2>
                <span className="font-label-sm text-secondary text-[12px]">{filtered.length} results</span>
              </div>

              {/* Timeline */}
              <div className="divide-y divide-border-light">
                {filtered.map((log, idx) => (
                  <div
                    key={log.id ?? idx}
                    className="flex items-start gap-4 px-space-md py-4 hover:bg-surface-container-low/40 transition-colors group"
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${log.color}`}>
                      <span className="material-symbols-outlined text-[18px]">{log.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-label-md text-label-md text-primary font-semibold leading-snug">
                            {log.action}
                          </p>
                          <p className="font-body-sm text-[12px] text-secondary mt-0.5 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[12px]">person</span>
                            {log.user ?? "System"}
                            {log.ipAddress && (
                              <>
                                <span className="text-border-light">·</span>
                                <span className="font-mono">{log.ipAddress}</span>
                              </>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={categoryBadgeVariant(log.category as CategoryFilter)}>
                            {log.category}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="shrink-0 text-right">
                      <p className="font-label-sm text-[11px] text-secondary whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-center font-body-sm text-secondary text-[12px] pb-8">
            Audit logs are tamper-evident records. This view is read-only.
          </p>
        </div>
      </main>
    </DashboardLayout>
  );
}
