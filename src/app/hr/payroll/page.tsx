"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";
import { calculateSalaryBreakdown } from "@/services/payrollService";
import { SalaryStructureConfigSchema } from "@/lib/validations/payroll";

// ─── helpers ─────────────────────────────────────────────────────────────────

const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

function Badge({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "neutral" | "info";
}) {
  const cls = {
    success: "bg-success-soft text-success-text border-success-text/10",
    warning: "bg-warning-soft text-warning-text border-warning-text/10",
    danger: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-surface-container-low text-secondary border-border-light",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  }[variant];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${cls}`}>
      {children}
    </span>
  );
}

// ─── confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  confirmVariant = "danger",
}: {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-surface-container-lowest border border-border-light rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmVariant === "danger" ? "bg-red-100" : "bg-primary/10"}`}>
            <span className={`material-symbols-outlined text-2xl ${confirmVariant === "danger" ? "text-red-600" : "text-primary"}`}>
              {confirmVariant === "danger" ? "warning" : "check_circle"}
            </span>
          </div>
          <h3 className="font-headline-md text-headline-md text-primary font-bold mb-2">{title}</h3>
          <p className="font-body-md text-body-md text-secondary leading-relaxed">{description}</p>
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-border-light text-secondary font-label-md font-medium hover:bg-surface-container-low transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-label-md font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
              confirmVariant === "danger"
                ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-400"
                : "bg-ink text-on-primary hover:opacity-90 focus:ring-primary"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── salary editor ────────────────────────────────────────────────────────────

function SalaryEditor({
  employeeId,
  employeeName,
  initialSalary,
  onSaved,
}: {
  employeeId: string;
  employeeName: string;
  initialSalary: any;
  onSaved: () => void;
}) {
  const { updateSalaryProfile, addAuditLog } = useApp();

  const [base, setBase] = useState(String(initialSalary?.base ?? ""));
  const [basicPct, setBasicPct] = useState(String(initialSalary?.basicPct ?? 50));
  const [hraPct, setHraPct] = useState(String(initialSalary?.hraPct ?? 25));
  const [stdPct, setStdPct] = useState(String(initialSalary?.stdPct ?? 15));
  const [pfPct] = useState(String(initialSalary?.pfPct ?? 12)); // fixed per policy
  const [ptFixed] = useState(String(initialSalary?.ptFixed ?? 200)); // fixed per policy
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const baseNum = parseFloat(base) || 0;
  const bPct = parseFloat(basicPct) || 0;
  const hPct = parseFloat(hraPct) || 0;
  const sPct = parseFloat(stdPct) || 0;
  const specialPct = Math.max(0, 100 - bPct - hPct - sPct);
  const totalPct = bPct + hPct + sPct + specialPct;

  const config = { basicPct: bPct, hraPct: hPct, stdPct: sPct, specialPct, pfPct: 12, ptFixed: 200 };
  const breakdown = baseNum > 0 ? calculateSalaryBreakdown(baseNum, config) : null;

  const validate = () => {
    const result = SalaryStructureConfigSchema.safeParse({
      base: baseNum,
      basicPct: bPct,
      hraPct: hPct,
      stdPct: sPct,
      specialPct,
      pfPct: 12,
      ptFixed: 200,
      tdsMonthly: 0,
    });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        errs[String(i.path[0] ?? "general")] = i.message;
      });
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSaveClick = () => {
    if (!validate()) return;
    setConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    setConfirmOpen(false);
    updateSalaryProfile(employeeId, {
      base: baseNum,
      basicPct: bPct,
      hraPct: hPct,
      stdPct: sPct,
      pfPct: 12,
      ptFixed: 200,
    } as any);
    addAuditLog(`updated salary structure for ${employeeName} — CTC ${INR(baseNum)}`, "HR Admin");
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onSaved();
    }, 1200);
  };

  const inputCls = (field: string) =>
    `w-full px-4 py-3 bg-surface-container-lowest border rounded-lg font-body-md text-body-md text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
      errors[field] ? "border-red-400 focus:ring-red-300" : "border-border-light focus:border-primary"
    }`;

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        title="Save Salary Profile?"
        description={`You are setting ${employeeName}'s annual CTC to ${INR(baseNum)}. This will take effect immediately and be logged in the audit trail.`}
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirmOpen(false)}
        confirmLabel="Save Salary"
        confirmVariant="primary"
      />

      <div className="space-y-space-lg">
        {/* Annual CTC */}
        <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-md shadow-sm">
          <h3 className="font-headline-md text-headline-md text-primary font-bold mb-space-md flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">payments</span>
            Annual CTC (₹)
          </h3>
          <div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-bold">₹</span>
              <input
                id="base-salary"
                className={`${inputCls("base")} pl-8`}
                placeholder="e.g. 1200000"
                type="number"
                min="0"
                step="10000"
                value={base}
                onChange={(e) => setBase(e.target.value)}
                aria-label="Annual base salary in INR"
              />
            </div>
            {errors.base && <p className="text-red-600 text-[12px] mt-1 font-medium">{errors.base}</p>}
            {baseNum > 0 && (
              <p className="text-secondary text-[12px] mt-1">
                Monthly base: <strong className="text-primary">{INR(baseNum / 12)}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Allocation Percentages */}
        <div className="bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden shadow-sm">
          <div className="px-space-md py-4 border-b border-border-light bg-surface-container-low/50 flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md text-primary font-bold">Component Allocation</h3>
            <Badge variant={Math.abs(totalPct - 100) < 0.01 ? "success" : "warning"}>
              {totalPct.toFixed(0)}% allocated
            </Badge>
          </div>

          <div className="divide-y divide-border-light">
            {/* Basic */}
            {[
              { label: "Basic Salary", sublabel: "Core pay component", field: "basicPct", value: basicPct, setter: setBasicPct, readonly: false },
              { label: "House Rent Allowance (HRA)", sublabel: "Accommodation benefit", field: "hraPct", value: hraPct, setter: setHraPct, readonly: false },
              { label: "Standard Allowance", sublabel: "Fixed operational benefit", field: "stdPct", value: stdPct, setter: setStdPct, readonly: false },
              { label: "Special Allowance", sublabel: "Auto-computed (100 − Basic − HRA − Std)", field: "specialPct", value: String(specialPct.toFixed(2)), setter: null, readonly: true },
            ].map(({ label, sublabel, field, value, setter, readonly }) => (
              <div key={field} className="grid grid-cols-12 gap-4 px-space-md py-4 items-center hover:bg-slate-surface/30 transition-colors">
                <div className="col-span-7">
                  <p className="font-label-md text-label-md text-primary font-semibold">{label}</p>
                  <p className="text-[11px] text-secondary mt-0.5">{sublabel}</p>
                </div>
                <div className="col-span-2 text-right">
                  {readonly ? (
                    <span className="font-body-md text-body-md text-secondary font-medium">{value}%</span>
                  ) : (
                    <div className="inline-flex items-center border border-border-light rounded-lg bg-surface-container-lowest overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
                      <input
                        className="w-14 text-center py-2 bg-transparent font-body-md text-body-md text-primary focus:outline-none"
                        type="number"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => setter!(e.target.value)}
                        aria-label={`${label} percentage`}
                      />
                      <span className="text-secondary pr-2 font-bold text-sm">%</span>
                    </div>
                  )}
                </div>
                <div className="col-span-3 text-right font-body-md text-body-md text-primary font-medium">
                  {breakdown ? INR(
                    field === "basicPct" ? breakdown.earnings.basic
                    : field === "hraPct" ? breakdown.earnings.hra
                    : field === "stdPct" ? breakdown.earnings.standardAllowance
                    : breakdown.earnings.specialAllowance
                  ) : "—"}
                </div>
              </div>
            ))}
          </div>

          {errors.specialPct && (
            <div className="px-space-md py-3 bg-red-50 border-t border-red-200">
              <p className="text-red-600 text-[12px] font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {errors.specialPct}
              </p>
            </div>
          )}
        </div>

        {/* Statutory Deductions */}
        <div className="bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden shadow-sm">
          <div className="px-space-md py-4 border-b border-border-light bg-surface-container-low/50">
            <h3 className="font-headline-md text-headline-md text-primary font-bold">Statutory Deductions</h3>
            <p className="text-secondary text-[12px] mt-0.5">Fixed per compliance rules — not editable</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-border-light">
            <div className="p-space-md">
              <p className="font-label-sm text-[11px] text-secondary uppercase tracking-wide font-bold mb-1">Provident Fund</p>
              <p className="font-body-md text-body-md text-primary font-semibold">{pfPct}% of Basic</p>
              {breakdown && <p className="text-secondary text-[12px] mt-1">{INR(breakdown.deductions.providentFund)} / month</p>}
            </div>
            <div className="p-space-md">
              <p className="font-label-sm text-[11px] text-secondary uppercase tracking-wide font-bold mb-1">Professional Tax</p>
              <p className="font-body-md text-body-md text-primary font-semibold">₹{ptFixed} fixed</p>
              <p className="text-secondary text-[12px] mt-1">Per month, statutory</p>
            </div>
          </div>
        </div>

        {/* Net Pay Preview */}
        {breakdown && (
          <div className="bg-ink rounded-xl p-6 flex justify-between items-center shadow-lg">
            <div>
              <p className="text-on-primary/60 text-[11px] uppercase tracking-wider font-bold mb-1">Monthly Net Pay (Preview)</p>
              <p className="text-on-primary font-black text-3xl tracking-tight">{INR(breakdown.netMonthlyPay)}</p>
            </div>
            <div className="text-right">
              <p className="text-on-primary/60 text-[11px] uppercase tracking-wider font-bold mb-1">Annual CTC</p>
              <p className="text-on-primary font-semibold text-xl">{INR(baseNum)}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-4">
          <button
            onClick={onSaved}
            className="px-6 py-2.5 rounded-xl border border-border-light text-secondary font-label-md font-medium hover:bg-surface-container-low transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            disabled={saved}
            className="px-6 py-2.5 rounded-xl bg-ink text-on-primary font-label-md font-bold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1"
          >
            {saved ? (
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Saved!
              </span>
            ) : (
              "Save Salary Profile"
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function HRPayrollPage() {
  const router = useRouter();
  const { employees, currentRole } = useApp();

  React.useEffect(() => {
    if (currentRole !== "admin") {
      router.replace("/payroll");
    }
  }, [currentRole, router]);

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (currentRole !== "admin") {
    return null;
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q)
    );
  }, [employees, search]);

  const selected = employees.find((e) => e.id === selectedId) ?? null;

  return (
    <DashboardLayout>
      <main className="flex-1 p-gutter-mobile lg:p-gutter-desktop max-w-container-max mx-auto w-full">
        <div className="max-w-6xl mx-auto space-y-space-xl">

          {/* Page Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-1 font-bold">
                HR Administration
              </p>
              <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Payroll Management</h1>
              <p className="font-body-md text-body-md text-secondary mt-1">
                Configure salary structures and component allocations per employee.
              </p>
            </div>
            <Badge variant="info">{employees.length} employees</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-space-lg items-start">
            {/* Employee Selector Panel */}
            <div className="lg:col-span-2 bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden shadow-sm">
              <div className="px-space-md py-4 border-b border-border-light bg-surface-container-low/50">
                <h2 className="font-headline-md text-headline-md text-primary font-bold mb-3">Select Employee</h2>
                {/* Search */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-[18px]">search</span>
                  <input
                    className="w-full pl-9 pr-4 py-2.5 bg-surface-container-lowest border border-border-light rounded-lg font-body-md text-body-md text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    placeholder="Search by name or dept…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search employees"
                  />
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="p-8 text-center text-secondary">
                    <span className="material-symbols-outlined text-3xl mb-2 block">search_off</span>
                    <p className="font-body-md">No employees match your search</p>
                  </div>
                ) : (
                  filtered.map((emp) => {
                    const hasSalary = emp.salary?.base > 0;
                    const isSelected = emp.id === selectedId;
                    return (
                      <button
                        key={emp.id}
                        onClick={() => setSelectedId(emp.id)}
                        className={`w-full text-left px-space-md py-4 flex items-center gap-3 transition-all border-b border-border-light last:border-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/30 ${
                          isSelected
                            ? "bg-primary/5 border-l-4 border-l-primary"
                            : "hover:bg-surface-container-low"
                        }`}
                        aria-pressed={isSelected}
                        aria-label={`Select ${emp.name}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold shrink-0">
                          {emp.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-label-md text-label-md text-primary font-semibold truncate">{emp.name}</p>
                          <p className="text-secondary text-[12px] truncate">{emp.role} · {emp.department}</p>
                        </div>
                        <div className="shrink-0">
                          {hasSalary ? (
                            <Badge variant="success">Configured</Badge>
                          ) : (
                            <Badge variant="warning">Not set</Badge>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Editor Panel */}
            <div className="lg:col-span-3">
              {!selected ? (
                <div className="bg-surface-container-lowest border border-dashed border-border-light rounded-xl p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl text-secondary">person_search</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold mb-2">
                    No Employee Selected
                  </h3>
                  <p className="font-body-md text-body-md text-secondary">
                    Select an employee from the list to configure their salary structure.
                  </p>
                </div>
              ) : (
                <div className="space-y-space-md">
                  {/* Selected Employee Context Bar */}
                  <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-md flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg shrink-0">
                      {selected.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-headline-md text-headline-md text-primary font-bold">{selected.name}</p>
                      <p className="text-secondary text-[13px]">{selected.role} · {selected.department}</p>
                    </div>
                    <Badge variant={selected.status === "Active" ? "success" : "neutral"}>
                      {selected.status}
                    </Badge>
                  </div>

                  {/* Salary Editor */}
                  <SalaryEditor
                    key={selected.id}
                    employeeId={selected.id}
                    employeeName={selected.name}
                    initialSalary={selected.salary}
                    onSaved={() => setSelectedId(null)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
