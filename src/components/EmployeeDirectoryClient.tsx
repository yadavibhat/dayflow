"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Employee } from "@/lib/types/employee";

interface EmployeeDirectoryClientProps {
  employees: Employee[];
}

export function EmployeeDirectoryClient({ employees }: EmployeeDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Client-side filter over the server-fetched list
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  return (
    <>
      {/* Header + Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
        <div>
          <h1 className="font-headline-lg text-headline-lg gradient-heading font-bold">
            Employee Directory
          </h1>
          <p className="font-body-md text-secondary mt-2">
            {employees.length} team member{employees.length !== 1 ? "s" : ""} on record.
          </p>
        </div>
        <div className="flex items-center gap-space-sm w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">
              search
            </span>
            <input
              className="w-full bg-surface-container-lowest border border-border-light rounded-lg pl-9 pr-3 py-2.5 font-body-md text-ink focus:outline-none focus:border-ink transition-colors"
              placeholder="Search by name, dept, or role..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Link
            href="/employees?add=true"
            className="bg-ink text-on-primary font-label-md text-label-md px-4 py-2.5 rounded-lg hover:bg-primary transition-colors font-bold flex items-center gap-1.5 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span className="hidden sm:inline">Add Employee</span>
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {employees.length === 0 && (
        <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-xl text-center py-20 shadow-sm">
          <span className="material-symbols-outlined text-secondary text-5xl mb-4 opacity-40">
            group_off
          </span>
          <h2 className="font-headline-md text-primary font-bold mb-2">
            No employees yet
          </h2>
          <p className="text-secondary font-body-md max-w-md mx-auto mb-6">
            The employee directory is empty. Start by adding your first team member to populate
            the org chart and enable attendance, payroll, and leave management.
          </p>
          <Link
            href="/employees?add=true"
            className="bg-ink text-on-primary font-label-md text-label-md px-6 py-2.5 rounded-lg hover:bg-primary transition-colors font-bold inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add First Employee
          </Link>
        </div>
      )}

      {/* No search results */}
      {employees.length > 0 && filtered.length === 0 && (
        <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-lg text-center py-16 shadow-sm">
          <span className="material-symbols-outlined text-secondary text-4xl mb-3 opacity-40">
            search_off
          </span>
          <h3 className="font-headline-md text-primary font-bold mb-1">No matches</h3>
          <p className="text-secondary font-body-md">
            No employees match &quot;{searchQuery}&quot;. Try a different search term.
          </p>
        </div>
      )}

      {/* Desktop Table */}
      {filtered.length > 0 && (
        <div className="hidden lg:block bg-surface-container-lowest border border-border-light rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light bg-surface-container-low/50">
                <th className="text-left font-label-sm text-label-sm text-secondary font-bold px-space-lg py-3 uppercase tracking-wider">
                  Employee
                </th>
                <th className="text-left font-label-sm text-label-sm text-secondary font-bold px-space-lg py-3 uppercase tracking-wider">
                  Department
                </th>
                <th className="text-left font-label-sm text-label-sm text-secondary font-bold px-space-lg py-3 uppercase tracking-wider">
                  Designation
                </th>
                <th className="text-left font-label-sm text-label-sm text-secondary font-bold px-space-lg py-3 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left font-label-sm text-label-sm text-secondary font-bold px-space-lg py-3 uppercase tracking-wider">
                  Code
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b border-border-light/50 last:border-0 hover:bg-surface-container-low/30 transition-colors"
                >
                  <td className="px-space-lg py-space-md">
                    <Link
                      href={`/employees/${emp.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high border border-border-light shrink-0">
                        {emp.avatar ? (
                          <img
                            alt={emp.name}
                            className="w-full h-full object-cover"
                            src={emp.avatar}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-secondary font-bold text-sm">
                            {emp.name.split(" ").map((n: string) => n[0]).join("")}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-body-md text-ink font-semibold group-hover:text-primary transition-colors">
                          {emp.name}
                        </p>
                        <p className="font-body-sm text-secondary text-xs">
                          {emp.email || "No email"}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-space-lg py-space-md">
                    <span className="text-[11px] text-secondary font-label-sm uppercase tracking-wider bg-surface-container-low px-2 py-0.5 rounded">
                      {emp.department}
                    </span>
                  </td>
                  <td className="px-space-lg py-space-md font-body-md text-secondary">
                    {emp.role}
                  </td>
                  <td className="px-space-lg py-space-md">
                    {emp.todayStatus ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded font-label-sm text-label-sm font-bold border ${
                          emp.todayStatus === "Present"
                            ? "bg-success-soft text-success-text border-success-text/10"
                            : "bg-warning-soft text-warning-text border-warning-text/10"
                        }`}
                      >
                        {emp.todayStatus}
                      </span>
                    ) : (
                      <span className="text-secondary/50 font-body-sm">—</span>
                    )}
                  </td>
                  <td className="px-space-lg py-space-md font-body-sm text-secondary font-mono">
                    {emp.employeeCode}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Cards */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md lg:hidden">
          {filtered.map((emp) => (
            <Link
              key={emp.id}
              href={`/employees/${emp.id}`}
              className="glass-card border border-border-light rounded-xl p-space-md flex flex-col items-center text-center hover-lift cursor-pointer group"
            >
              <div className="relative mb-3">
                {emp.avatar ? (
                  <img
                    alt={emp.name}
                    className="w-16 h-16 rounded-full object-cover border border-border-light"
                    src={emp.avatar}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center border border-border-light text-secondary font-bold text-xl">
                    {emp.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                )}
                {emp.todayStatus && (
                  <div
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-surface-container-lowest ${
                      emp.todayStatus === "Present"
                        ? "bg-success-text pulse-active-ring"
                        : "bg-warning-text"
                    }`}
                    title={emp.todayStatus}
                  ></div>
                )}
              </div>
              <h3 className="font-headline-md text-ink font-bold group-hover:text-primary transition-colors text-sm">
                {emp.name}
              </h3>
              <p className="font-body-sm text-secondary text-xs mt-0.5">{emp.role}</p>
              <span className="text-[10px] text-secondary font-label-sm uppercase tracking-wider mt-1.5 bg-surface-container-low px-2 py-0.5 rounded">
                {emp.department}
              </span>
              <div className="mt-3 pt-3 border-t border-border-light w-full flex items-center justify-center gap-2">
                {emp.todayStatus && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded font-label-sm text-[10px] font-bold border ${
                      emp.todayStatus === "Present"
                        ? "bg-success-soft text-success-text border-success-text/10"
                        : "bg-warning-soft text-warning-text border-warning-text/10"
                    }`}
                  >
                    {emp.todayStatus}
                  </span>
                )}
                <span className="text-[10px] text-secondary font-mono">{emp.employeeCode}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
