"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";
import { calculateSalaryBreakdown } from "@/services/payrollService";

// ─── helpers ─────────────────────────────────────────────────────────────────

const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const currentPeriod = () => {
  const d = new Date();
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

// ─── status badge ─────────────────────────────────────────────────────────────

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
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${cls}`}
    >
      {children}
    </span>
  );
}

// ─── row ─────────────────────────────────────────────────────────────────────

function SalaryRow({
  label,
  sublabel,
  amount,
  type = "earning",
}: {
  label: string;
  sublabel?: string;
  amount: number;
  type?: "earning" | "deduction" | "total";
}) {
  const amtCls =
    type === "deduction"
      ? "text-red-600 font-semibold"
      : type === "total"
      ? "text-primary font-bold text-body-lg"
      : "text-primary font-medium";

  return (
    <div
      className={`grid grid-cols-2 items-center px-space-md py-3.5 hover:bg-surface-container-low/50 transition-colors ${
        type === "total" ? "border-t-2 border-border-light bg-surface-container-low/30" : ""
      }`}
    >
      <div>
        <p className="font-label-md text-label-md text-primary font-semibold">{label}</p>
        {sublabel && (
          <p className="font-body-sm text-[11px] text-secondary mt-0.5 uppercase tracking-wide">{sublabel}</p>
        )}
      </div>
      <div className={`text-right font-body-md text-body-md ${amtCls}`}>
        {type === "deduction" ? `− ${INR(amount)}` : INR(amount)}
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function EmployeePayrollPage() {
  const router = useRouter();
  const { currentUser, currentRole } = useApp();

  React.useEffect(() => {
    if (currentRole === "admin") {
      router.replace("/hr/payroll");
    }
  }, [currentRole, router]);

  if (currentRole === "admin") {
    return null;
  }

  const salary = currentUser?.salary;
  const hasSalary = salary && salary.base > 0;

  if (!hasSalary) {
    return (
      <DashboardLayout>
        <main className="flex-1 p-gutter-mobile lg:p-gutter-desktop max-w-container-max mx-auto w-full">
          <div className="max-w-2xl mx-auto py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-secondary">payments</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary font-bold mb-3">
              Salary Not Yet Configured
            </h1>
            <p className="font-body-md text-body-md text-secondary leading-relaxed">
              Your salary structure hasn't been set up by HR yet. Please contact your HR admin if you believe this is incorrect.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center gap-2 bg-ink text-on-primary px-6 py-3 rounded-xl font-label-md font-bold hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Dashboard
            </Link>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  const breakdown = calculateSalaryBreakdown(salary.base, {
    basicPct: salary.basicPct,
    hraPct: salary.hraPct,
    stdPct: salary.stdPct,
    pfPct: salary.pfPct,
    ptFixed: salary.ptFixed,
  });

  const netPay = breakdown.netMonthlyPay;
  const grossEarnings = breakdown.earnings.totalEarnings;
  const totalDeductions = breakdown.deductions.totalDeductions;

  return (
    <DashboardLayout>
      <main className="flex-1 p-gutter-mobile lg:p-gutter-desktop max-w-container-max mx-auto w-full">
        <div className="max-w-3xl mx-auto space-y-space-xl">

          {/* Page Header */}
          <div>
            <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-1 font-bold">
              My Compensation
            </p>
            <h1 className="font-headline-lg text-headline-lg text-primary font-bold flex items-center gap-3">
              Salary Breakdown
              <Badge variant="info">{currentPeriod()}</Badge>
            </h1>
            <p className="font-body-md text-body-md text-secondary mt-1">
              Read-only view of your current salary structure. Contact HR for any changes.
            </p>
          </div>

          {/* Net Pay Hero */}
          <div className="glass-card rounded-2xl p-8 border border-border-light shadow-sm bg-gradient-to-br from-surface-container-lowest to-surface-container-low relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-8 translate-x-8" />
            <div className="relative">
              <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold mb-2">
                Net Monthly Pay
              </p>
              <p className="font-headline-lg text-primary font-black text-5xl tracking-tight">
                {INR(netPay)}
              </p>
              <p className="font-body-md text-body-md text-secondary mt-2">
                After all statutory deductions · {currentPeriod()}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border-light">
              <div>
                <p className="font-label-sm text-[11px] text-secondary uppercase tracking-wide font-bold mb-1">Annual CTC</p>
                <p className="font-body-md text-body-md text-primary font-semibold">{INR(salary.base)}</p>
              </div>
              <div>
                <p className="font-label-sm text-[11px] text-secondary uppercase tracking-wide font-bold mb-1">Gross Monthly</p>
                <p className="font-body-md text-body-md text-primary font-semibold">{INR(grossEarnings)}</p>
              </div>
              <div>
                <p className="font-label-sm text-[11px] text-secondary uppercase tracking-wide font-bold mb-1">Total Deductions</p>
                <p className="font-body-md text-body-md text-red-600 font-semibold">{INR(totalDeductions)}</p>
              </div>
            </div>
          </div>

          {/* Earnings Table */}
          <div className="bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden shadow-sm">
            <div className="px-space-md py-4 border-b border-border-light bg-surface-container-low/50 flex items-center gap-2">
              <span className="material-symbols-outlined text-success-text text-[18px]">trending_up</span>
              <h2 className="font-headline-md text-headline-md text-primary font-bold">Earnings</h2>
              <Badge variant="success">Gross {INR(grossEarnings)}</Badge>
            </div>
            <div className="divide-y divide-border-light">
              <SalaryRow
                label="Basic Salary"
                sublabel={`${salary.basicPct}% of Annual CTC`}
                amount={breakdown.earnings.basic}
              />
              <SalaryRow
                label="House Rent Allowance (HRA)"
                sublabel={`${salary.hraPct}% of Annual CTC`}
                amount={breakdown.earnings.hra}
              />
              <SalaryRow
                label="Standard Allowance"
                sublabel={`${salary.stdPct}% of Annual CTC`}
                amount={breakdown.earnings.standardAllowance}
              />
              <SalaryRow
                label="Special Allowance"
                sublabel="Balance allocation"
                amount={breakdown.earnings.specialAllowance}
              />
              <SalaryRow label="Total Gross Earnings" amount={grossEarnings} type="total" />
            </div>
          </div>

          {/* Deductions Table */}
          <div className="bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden shadow-sm">
            <div className="px-space-md py-4 border-b border-border-light bg-surface-container-low/50 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500 text-[18px]">trending_down</span>
              <h2 className="font-headline-md text-headline-md text-primary font-bold">Deductions</h2>
              <Badge variant="danger">Total {INR(totalDeductions)}</Badge>
            </div>
            <div className="divide-y divide-border-light">
              <SalaryRow
                label="Provident Fund (PF)"
                sublabel={`${salary.pfPct}% of Basic`}
                amount={breakdown.deductions.providentFund}
                type="deduction"
              />
              <SalaryRow
                label="Professional Tax (PT)"
                sublabel="Statutory fixed deduction"
                amount={breakdown.deductions.professionalTax}
                type="deduction"
              />
              {breakdown.deductions.taxDeductedAtSource > 0 && (
                <SalaryRow
                  label="Tax Deducted at Source (TDS)"
                  sublabel="Income tax withholding"
                  amount={breakdown.deductions.taxDeductedAtSource}
                  type="deduction"
                />
              )}
              <SalaryRow label="Total Deductions" amount={totalDeductions} type="total" />
            </div>
          </div>

          {/* Net Pay Footer */}
          <div className="bg-ink rounded-xl p-6 flex justify-between items-center shadow-lg">
            <div>
              <p className="text-on-primary/70 font-label-sm text-[11px] uppercase tracking-wider font-bold mb-1">
                Monthly Net Pay
              </p>
              <p className="text-on-primary font-black text-3xl tracking-tight">{INR(netPay)}</p>
            </div>
            <div className="text-right">
              <p className="text-on-primary/70 font-label-sm text-[11px] uppercase tracking-wider font-bold mb-1">
                Annual CTC
              </p>
              <p className="text-on-primary font-semibold text-xl">{INR(salary.base)}</p>
            </div>
          </div>

          <p className="text-center font-body-sm text-secondary text-[12px] pb-8">
            This is a system-generated salary statement for reference only. For official documentation, request a payslip from HR.
          </p>
        </div>
      </main>
    </DashboardLayout>
  );
}
