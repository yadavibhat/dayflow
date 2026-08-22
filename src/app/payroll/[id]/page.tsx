"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp, SalaryProfile } from "@/context/AppContext";
import { calculateSalaryBreakdown } from "@/services/payrollService";
import { SalaryStructureConfigSchema } from "@/lib/validations/payroll";

// ─── helpers ─────────────────────────────────────────────────────────────────

const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

function Badge({ children, variant = "neutral" }: { children: React.ReactNode; variant?: string }) {
  const cls: Record<string, string> = {
    success: "bg-success-soft text-success-text border-success-text/10",
    warning: "bg-warning-soft text-warning-text border-warning-text/10",
    neutral: "bg-surface-container-low text-secondary border-border-light",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${cls[variant] ?? cls.neutral}`}>
      {children}
    </span>
  );
}

// ─── confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  open, title, description, onConfirm, onCancel, confirmLabel = "Confirm", danger = false,
}: {
  open: boolean; title: string; description: string;
  onConfirm: () => void; onCancel: () => void;
  confirmLabel?: string; danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-surface-container-lowest border border-border-light rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${danger ? "bg-red-100" : "bg-primary/10"}`}>
            <span className={`material-symbols-outlined text-2xl ${danger ? "text-red-600" : "text-primary"}`}>
              {danger ? "warning" : "check_circle"}
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
              danger
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

// ─── page ─────────────────────────────────────────────────────────────────────

export default function PayrollManagementPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { employees, currentRole, updateSalaryProfile, addAuditLog } = useApp();

  React.useEffect(() => {
    if (currentRole !== "admin") {
      router.replace("/payroll");
    }
  }, [currentRole, router]);

  const employee = employees.find((e) => e.id === id);

  if (currentRole !== "admin") {
    return null;
  }

  // ── form state ──
  const [base, setBase] = useState("");
  const [basicPct, setBasicPct] = useState("50");
  const [hraPct, setHraPct] = useState("25");
  const [stdPct, setStdPct] = useState("15");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (employee) {
      setBase(String(employee.salary.base));
      setBasicPct(String(employee.salary.basicPct));
      setHraPct(String(employee.salary.hraPct));
      setStdPct(String(employee.salary.stdPct));
    }
  }, [employee]);

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="p-gutter-desktop max-w-5xl mx-auto text-center py-20">
          <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-secondary">person_off</span>
          </div>
          <h2 className="font-headline-lg text-primary font-bold">Employee Not Found</h2>
          <p className="text-secondary mt-2">The requested employee record does not exist.</p>
          <Link href="/hr/payroll" className="mt-6 inline-flex items-center gap-2 bg-ink text-on-primary px-5 py-2.5 rounded-xl font-label-md font-bold hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Payroll
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // ── derived values ──
  const baseNum = parseFloat(base) || 0;
  const bPct = parseFloat(basicPct) || 0;
  const hPct = parseFloat(hraPct) || 0;
  const sPct = parseFloat(stdPct) || 0;
  const specialPct = Math.max(0, 100 - bPct - hPct - sPct);
  const totalPct = bPct + hPct + sPct + specialPct;

  const config = { basicPct: bPct, hraPct: hPct, stdPct: sPct, specialPct, pfPct: 12, ptFixed: 200 };
  const breakdown = baseNum > 0 ? calculateSalaryBreakdown(baseNum, config) : null;

  // ── validation ──
  const validate = (): boolean => {
    const result = SalaryStructureConfigSchema.safeParse({
      base: baseNum, basicPct: bPct, hraPct: hPct, stdPct: sPct, specialPct,
      pfPct: 12, ptFixed: 200, tdsMonthly: 0,
    });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => { errs[String(i.path[0] ?? "general")] = i.message; });
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSaveClick = () => { if (validate()) setConfirmSave(true); };
  const handleDiscardClick = () => setConfirmDiscard(true);

  const handleConfirmSave = () => {
    setConfirmSave(false);
    updateSalaryProfile(employee.id, {
      base: baseNum, basicPct: bPct, hraPct: hPct, stdPct: sPct,
      pfPct: 12, ptFixed: 200,
    } as SalaryProfile);
    addAuditLog(`updated salary structure for ${employee.name} — CTC ${INR(baseNum)}`, "HR Admin");
    setIsSaved(true);
    setTimeout(() => { setIsSaved(false); router.push("/hr/payroll"); }, 1200);
  };

  const handleConfirmDiscard = () => { setConfirmDiscard(false); router.push("/hr/payroll"); };

  const inputCls = (field: string) =>
    `w-full px-4 py-3 bg-surface-container-lowest border rounded-lg font-body-md text-body-md text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
      errors[field] ? "border-red-400 focus:ring-red-300" : "border-border-light focus:border-primary"
    }`;

  return (
    <DashboardLayout>
      {/* Dialogs */}
      <ConfirmDialog
        open={confirmSave}
        title="Save Salary Profile?"
        description={`You are setting ${employee.name}'s annual CTC to ${INR(baseNum)}. This will be logged in the audit trail and applied immediately.`}
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirmSave(false)}
        confirmLabel="Save Profile"
      />
      <ConfirmDialog
        open={confirmDiscard}
        title="Discard Changes?"
        description="Your unsaved changes will be lost. This cannot be undone."
        onConfirm={handleConfirmDiscard}
        onCancel={() => setConfirmDiscard(false)}
        confirmLabel="Discard"
        danger
      />

      <main className="flex-1 p-gutter-mobile lg:p-gutter-desktop max-w-container-max mx-auto w-full">
        <div className="max-w-5xl mx-auto space-y-space-xl">

          {/* Header */}
          <div>
            <Link
              className="inline-flex items-center text-secondary hover:text-primary font-label-sm text-label-sm uppercase tracking-wider mb-space-sm font-bold transition-colors"
              href="/hr/payroll"
            >
              <span className="material-symbols-outlined text-[16px] mr-1">arrow_back</span>
              Payroll Management
            </Link>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary flex items-center gap-3 font-bold flex-wrap">
              {employee.name}
              <Badge variant={employee.status === "Active" ? "success" : "neutral"}>{employee.status}</Badge>
            </h1>
            <p className="font-body-md text-body-md text-secondary mt-1">
              {employee.role} · {employee.department}
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
            {/* Left: CTC Input + Status */}
            <div className="lg:col-span-4 space-y-space-lg">

              {/* CTC Card */}
              <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-md shadow-sm">
                <div className="flex items-center justify-between mb-space-md">
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">Annual CTC</h3>
                  <span className="material-symbols-outlined text-secondary">payments</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-bold">₹</span>
                      <input
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
                    {errors.base && <p className="text-red-600 text-[12px] mt-1">{errors.base}</p>}
                    {baseNum > 0 && (
                      <p className="text-secondary text-[12px] mt-1">
                        Monthly: <strong className="text-primary">{INR(baseNum / 12)}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Computation Status */}
              <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-md shadow-sm">
                <h3 className="font-headline-md text-headline-md text-primary mb-space-sm font-bold">
                  Computation Status
                </h3>
                {!breakdown ? (
                  <div className="border border-dashed border-outline-variant rounded-lg p-6 flex flex-col items-center text-center bg-slate-surface/30">
                    <span className="material-symbols-outlined text-secondary text-4xl mb-3 opacity-50">calculate</span>
                    <p className="font-label-md text-label-md text-primary mb-1 font-bold">Awaiting Input</p>
                    <p className="font-body-md text-body-md text-secondary leading-snug text-sm">
                      Enter the annual CTC to see computed components.
                    </p>
                  </div>
                ) : (
                  <div className="border border-success-text/20 bg-success-soft/30 rounded-lg p-6 flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-success-text text-4xl mb-3">check_circle</span>
                    <p className="font-label-md text-label-md text-success-text mb-1 font-bold">Computed</p>
                    <p className="font-body-md text-body-md text-secondary text-sm leading-snug">
                      Net monthly: <strong className="text-primary">{INR(breakdown.netMonthlyPay)}</strong>
                    </p>
                  </div>
                )}
              </div>

              {/* Statutory Deductions */}
              <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-md shadow-sm">
                <h3 className="font-headline-md text-headline-md text-primary mb-space-md font-bold">
                  Statutory Deductions
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border-light">
                    <div>
                      <p className="font-label-md text-label-md text-primary font-semibold">Provident Fund</p>
                      <p className="text-[11px] text-secondary">12% of Basic</p>
                    </div>
                    <p className="font-body-md text-body-md text-primary font-medium">
                      {breakdown ? INR(breakdown.deductions.providentFund) : "—"}
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <div>
                      <p className="font-label-md text-label-md text-primary font-semibold">Professional Tax</p>
                      <p className="text-[11px] text-secondary">Fixed statutory</p>
                    </div>
                    <p className="font-body-md text-body-md text-primary font-medium">₹200</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Component Configuration */}
            <div className="lg:col-span-8 space-y-space-lg">

              {/* Allocation Table */}
              <div className="bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden shadow-sm">
                <div className="px-space-md py-4 border-b border-border-light bg-slate-surface flex justify-between items-center">
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">Component Allocation</h3>
                  <Badge variant={Math.abs(totalPct - 100) < 0.01 ? "success" : "warning"}>
                    {totalPct.toFixed(0)}% allocated
                  </Badge>
                </div>

                {/* Header Row */}
                <div className="grid grid-cols-12 gap-4 px-space-md py-3 bg-slate-surface/50">
                  <div className="col-span-6 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">Component</div>
                  <div className="col-span-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider text-right font-bold">% Allocation</div>
                  <div className="col-span-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider text-right font-bold">Monthly (₹)</div>
                </div>

                <div className="divide-y divide-surface-container-low">
                  {[
                    { label: "Basic Salary", sublabel: "Core pay component", field: "basicPct", value: basicPct, setter: setBasicPct, computed: breakdown?.earnings.basic },
                    { label: "House Rent Allowance", sublabel: "Accommodation benefit", field: "hraPct", value: hraPct, setter: setHraPct, computed: breakdown?.earnings.hra },
                    { label: "Standard Allowance", sublabel: "Fixed operational benefit", field: "stdPct", value: stdPct, setter: setStdPct, computed: breakdown?.earnings.standardAllowance },
                    { label: "Special Allowance", sublabel: "Auto: 100 − Basic − HRA − Std", field: "specialPct", value: specialPct.toFixed(2), setter: null, computed: breakdown?.earnings.specialAllowance },
                  ].map(({ label, sublabel, field, value, setter, computed }) => (
                    <div key={field} className="grid grid-cols-12 gap-4 px-space-md py-4 items-center hover:bg-slate-surface transition-colors">
                      <div className="col-span-6">
                        <p className="font-label-md text-label-md text-primary font-semibold">{label}</p>
                        <p className="font-body-sm text-[11px] text-secondary mt-0.5">{sublabel}</p>
                      </div>
                      <div className="col-span-3 text-right">
                        {!setter ? (
                          <span className="font-body-md text-body-md text-secondary">{value}%</span>
                        ) : (
                          <div className="inline-flex items-center border border-border-light rounded-lg bg-surface-container-lowest overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
                            <input
                              className="w-14 text-center py-2 border-none bg-transparent font-body-md text-body-md text-primary focus:outline-none"
                              type="number"
                              min="0"
                              max="100"
                              value={value}
                              onChange={(e) => { setter(e.target.value); }}
                              aria-label={`${label} percentage`}
                            />
                            <span className="text-secondary pr-2 font-bold text-sm">%</span>
                          </div>
                        )}
                        {errors[field] && <p className="text-red-600 text-[11px] mt-1">{errors[field]}</p>}
                      </div>
                      <div className="col-span-3 text-right font-body-md text-body-md text-primary font-medium">
                        {computed !== undefined ? INR(computed) : "—"}
                      </div>
                    </div>
                  ))}
                </div>

                {errors.specialPct && (
                  <div className="px-space-md py-3 bg-red-50 border-t border-red-200 flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-600 text-[16px]">error</span>
                    <p className="text-red-600 text-[12px] font-medium">{errors.specialPct}</p>
                  </div>
                )}
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

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleDiscardClick}
                  className="px-6 py-2.5 bg-surface-container-lowest border border-border-light text-secondary font-label-md font-medium rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleSaveClick}
                  disabled={isSaved}
                  className="px-6 py-2.5 bg-ink text-on-primary font-label-md font-bold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1"
                >
                  {isSaved ? (
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Saved!
                    </span>
                  ) : "Save Salary Profile"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
