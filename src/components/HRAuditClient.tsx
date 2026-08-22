"use client";

import React, { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";

interface AuditLogEntry {
  id: string;
  actor_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  before_json: any;
  after_json: any;
  created_at: string;
}

interface HRAuditClientProps {
  initialLogs: AuditLogEntry[];
  pendingLeaveCount: number;
  draftPayrollCount: number;
}

const CATEGORIES = ["ALL", "EMPLOYEES", "LEAVES", "PAYROLL", "AUDIT"] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

function getCategory(log: AuditLogEntry): CategoryFilter {
  const type = (log.entity_type || "").toLowerCase();
  const act = (log.action || "").toLowerCase();
  if (type === "employees" || act.includes("profile") || act.includes("onboard")) return "EMPLOYEES";
  if (type === "leaves" || act.includes("leave")) return "LEAVES";
  if (type === "payroll" || act.includes("salary") || act.includes("pay")) return "PAYROLL";
  return "AUDIT";
}

function summarizeAuditLog(log: AuditLogEntry): string {
  try {
    const act = (log.action || "").toLowerCase();
    const before = log.before_json;
    const after = log.after_json;

    if (act.includes("salary_updated") || act.includes("salary")) {
      const beforeWage = before?.wage || before?.base || "Not set";
      const afterWage = after?.wage || after?.base || "Not set";
      return `Salary structure configuration updated. Annual CTC changed from ${
        typeof beforeWage === "number" ? `₹${beforeWage.toLocaleString("en-IN")}` : beforeWage
      } to ${
        typeof afterWage === "number" ? `₹${afterWage.toLocaleString("en-IN")}` : afterWage
      }.`;
    }

    if (act.includes("updated profile")) {
      const keys = after ? Object.keys(after).join(", ") : "profile fields";
      return `Profile information details updated. Fields affected: ${keys}.`;
    }

    if (act.includes("onboard") || act.includes("create")) {
      return `New employee onboarded successfully: Code ${after?.employeeCode || log.entity_id}.`;
    }

    if (act.includes("leave")) {
      return `Leave transaction status changed. Action details: "${log.action}".`;
    }

    return log.action || "System event log entry recorded.";
  } catch {
    return log.action || "System transaction logged.";
  }
}

export function HRAuditClient({ initialLogs, pendingLeaveCount, draftPayrollCount }: HRAuditClientProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filter logs locally
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return initialLogs.filter((log) => {
      const cat = getCategory(log);
      const matchCat = activeCategory === "ALL" || cat === activeCategory;
      const matchSearch =
        !q ||
        log.actor_id.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.entity_type.toLowerCase().includes(q) ||
        log.entity_id.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [initialLogs, activeCategory, search]);

  // Paginated chunk
  const paginatedLogs = useMemo(() => {
    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize;
    return filtered.slice(fromIndex, toIndex);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <DashboardLayout>
      <main className="flex-1 p-gutter-mobile lg:p-gutter-desktop max-w-container-max mx-auto w-full animate-fade-in">
        <div className="max-w-5xl mx-auto space-y-space-xl">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-1 font-bold">
                Security &amp; Operations
              </p>
              <h1 className="font-headline-lg text-headline-lg text-primary font-bold">System Audit Trail</h1>
              <p className="font-body-md text-body-md text-secondary mt-1">
                Chronological feed of administrative operations, configurations, and user actions.
              </p>
            </div>

            {/* Dashboard widgets */}
            <div className="flex gap-3">
              <div className="bg-surface-container-lowest border border-border-light rounded-xl px-4 py-2 text-center shadow-sm">
                <span className="text-xs font-bold text-secondary block uppercase tracking-wide">Pending Leaves</span>
                <span className="text-lg font-black text-primary">{pendingLeaveCount}</span>
              </div>
              <div className="bg-surface-container-lowest border border-border-light rounded-xl px-4 py-2 text-center shadow-sm">
                <span className="text-xs font-bold text-secondary block uppercase tracking-wide">Draft Payrolls</span>
                <span className="text-lg font-black text-primary">{draftPayrollCount}</span>
              </div>
            </div>
          </div>

          {/* Filtering bar */}
          <div className="bg-surface-container-lowest border border-border-light rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search */}
            <div className="relative w-full md:max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-[18px]">search</span>
              <input
                className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-border-light rounded-lg text-xs font-semibold text-primary focus:outline-none"
                placeholder="Search logs..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                    activeCategory === cat ? "bg-ink text-on-primary border-ink" : "bg-transparent text-secondary border-border-light"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Feed */}
          {filtered.length === 0 ? (
            <div className="bg-surface-container-lowest border border-border-light rounded-xl p-12 text-center shadow-sm">
              <span className="material-symbols-outlined text-4xl text-secondary mb-3 block">history</span>
              <h3 className="font-headline-md text-headline-md text-primary font-bold mb-1">No Activity Found</h3>
              <p className="font-body-md text-secondary">
                There are no matching transaction entries logged in the system audit trail.
              </p>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden shadow-sm divide-y divide-border-light">
              {paginatedLogs.map((log) => {
                const isExpanded = expandedId === log.id;
                const cat = getCategory(log);
                const summary = summarizeAuditLog(log);
                
                return (
                  <div key={log.id} className="p-space-md hover:bg-surface-container-low/20 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-secondary text-[18px]">
                            {cat === "EMPLOYEES" ? "person" : cat === "LEAVES" ? "event_busy" : cat === "PAYROLL" ? "payments" : "history"}
                          </span>
                        </div>
                        <div>
                          <p className="font-label-md text-primary font-semibold leading-tight">{summary}</p>
                          <p className="text-[11px] text-secondary mt-1">
                            Actor ID: <span className="font-mono text-primary font-medium">{log.actor_id}</span> · Entity: <span className="font-semibold text-primary">{log.entity_type} ({log.entity_id})</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-secondary block font-bold font-mono">
                          {new Date(log.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </span>
                        <span className="text-[9px] text-secondary block font-medium font-mono mt-0.5">
                          {new Date(log.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>

                    {/* Expandable JSON details */}
                    <div className="mt-3 ml-12">
                      <button
                        onClick={() => toggleExpand(log.id)}
                        className="text-[11px] text-primary hover:text-ink font-bold inline-flex items-center gap-1 focus:outline-none"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isExpanded ? "expand_less" : "expand_more"}
                        </span>
                        {isExpanded ? "Hide raw JSON snapshot" : "View raw JSON snapshot"}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 bg-surface-container-low border border-border-light rounded-lg p-3 font-mono text-[10px] overflow-x-auto text-primary max-h-48">
                          <pre>{JSON.stringify({ before: log.before_json, after: log.after_json }, null, 2)}</pre>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {filtered.length > pageSize && (
            <div className="flex justify-between items-center bg-surface-container-lowest border border-border-light rounded-xl p-4 shadow-sm">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 border border-border-light text-secondary rounded-lg text-xs font-bold hover:bg-surface-container-low disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs text-secondary font-semibold">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 border border-border-light text-secondary rounded-lg text-xs font-bold hover:bg-surface-container-low disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

        </div>
      </main>
    </DashboardLayout>
  );
}
