import React from "react";
import { fetchOwnPayroll } from "@/services/payroll";
import { getCurrentProfile } from "@/lib/services/employees";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EmployeePayrollPage() {
  // 1. Permission Gate: Get authenticated profile
  const { profile, error: authErr } = await getCurrentProfile();
  if (authErr || !profile) {
    redirect("/signin");
  }

  // Confirm role is employee
  if (profile.role !== "employee") {
    return (
      <DashboardLayout>
        <main className="flex-1 p-gutter-mobile lg:p-gutter-desktop max-w-container-max mx-auto w-full">
          <div className="max-w-2xl mx-auto py-20 text-center bg-surface-container-lowest border border-border-light rounded-2xl shadow-sm">
            <span className="material-symbols-outlined text-warning-text text-5xl mb-4">gpp_maybe</span>
            <h1 className="font-headline-lg text-headline-lg text-primary font-bold mb-2">Access Denied</h1>
            <p className="font-body-md text-secondary leading-relaxed mb-6">
              Only employees can view this personal compensation page. As an HR/Admin, please use the HR Payroll panel.
            </p>
            <Link
              href="/hr/payroll"
              className="inline-flex items-center gap-2 bg-ink text-on-primary px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity font-bold font-label-md"
            >
              Go to HR Payroll
            </Link>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  // 2. Fetch Own Payroll Records (scoped server-side to session employee_id)
  const result = await fetchOwnPayroll();

  // 3. Error State
  if (!result.success || !result.data) {
    return (
      <DashboardLayout>
        <main className="flex-1 p-gutter-mobile lg:p-gutter-desktop max-w-container-max mx-auto w-full animate-fade-in">
          <div className="max-w-2xl mx-auto py-20 text-center bg-surface-container-lowest border border-border-light rounded-2xl shadow-sm">
            <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error</span>
            <h1 className="font-headline-lg text-headline-lg text-primary font-bold mb-2">Failed to load payroll</h1>
            <p className="font-body-md text-secondary leading-relaxed mb-6">
              {result.error || "An unexpected error occurred while fetching your compensation data."}
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-ink text-on-primary px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity font-bold font-label-md"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  // 4. Empty State: No records exist
  if (result.data.length === 0) {
    return (
      <DashboardLayout>
        <main className="flex-1 p-gutter-mobile lg:p-gutter-desktop max-w-container-max mx-auto w-full animate-fade-in">
          <div className="max-w-2xl mx-auto py-20 text-center bg-surface-container-lowest border border-border-light rounded-2xl shadow-sm px-6">
            <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-secondary">payments</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary font-bold mb-3">
              No Payroll Records Generated Yet
            </h1>
            <p className="font-body-md text-body-md text-secondary leading-relaxed max-w-md mx-auto">
              Your payroll history appears here once HR generates monthly statements. Please contact your HR department for wage structure questions.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center gap-2 bg-ink text-on-primary px-6 py-3 rounded-xl font-label-md font-bold hover:opacity-90 transition-opacity shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Dashboard
            </Link>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  // 5. Success State: Populated
  // If multiple records, we display the latest record and list other periods
  const latestRecord = result.data[0];

  // Helper to format currency
  const INR = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <DashboardLayout>
      <main className="flex-1 p-gutter-mobile lg:p-gutter-desktop max-w-container-max mx-auto w-full animate-fade-in">
        <div className="max-w-3xl mx-auto space-y-space-xl">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-1 font-bold">
                My Compensation
              </p>
              <h1 className="font-headline-lg text-headline-lg text-primary font-bold flex items-center gap-3">
                Salary Statement
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-blue-50 text-blue-700 border-blue-200">
                  {latestRecord.pay_period}
                </span>
              </h1>
            </div>
            <div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                latestRecord.status === "Paid"
                  ? "bg-success-soft text-success-text border-success-text/10"
                  : latestRecord.status === "Generated"
                  ? "bg-warning-soft text-warning-text border-warning-text/10"
                  : "bg-surface-container-low text-secondary border-border-light"
              }`}>
                {latestRecord.status}
              </span>
            </div>
          </div>

          {/* Net Pay Hero */}
          <div className="glass-card rounded-2xl p-8 border border-border-light shadow-sm bg-gradient-to-br from-surface-container-lowest to-surface-container-low relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-8 translate-x-8" />
            <div className="relative">
              <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold mb-2">
                Net Monthly Pay
              </p>
              <p className="font-headline-lg text-primary font-black text-5xl tracking-tight">
                {INR(latestRecord.net_pay)}
              </p>
              <p className="font-body-md text-body-md text-secondary mt-2">
                After all statutory deductions · Period: {latestRecord.pay_period}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border-light">
              <div>
                <p className="font-label-sm text-[11px] text-secondary uppercase tracking-wide font-bold mb-1">Gross Earnings</p>
                <p className="font-body-md text-body-md text-primary font-semibold">
                  {INR(latestRecord.basic + latestRecord.allowances)}
                </p>
              </div>
              <div>
                <p className="font-label-sm text-[11px] text-secondary uppercase tracking-wide font-bold mb-1">Total Deductions</p>
                <p className="font-body-md text-body-md text-red-600 font-semibold">{INR(latestRecord.deductions)}</p>
              </div>
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden shadow-sm">
            <div className="px-space-md py-4 border-b border-border-light bg-surface-container-low/50 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">payments</span>
              <h2 className="font-headline-md text-headline-md text-primary font-bold">Salary Components</h2>
            </div>
            
            <div className="divide-y divide-border-light">
              <div className="grid grid-cols-2 items-center px-space-md py-3.5 hover:bg-surface-container-low/50 transition-colors">
                <span className="font-label-md text-primary font-semibold">Basic Pay</span>
                <span className="text-right font-body-md text-primary font-medium">{INR(latestRecord.basic)}</span>
              </div>
              <div className="grid grid-cols-2 items-center px-space-md py-3.5 hover:bg-surface-container-low/50 transition-colors">
                <div>
                  <span className="font-label-md text-primary font-semibold">Allowances Total</span>
                  <p className="text-[10px] text-secondary">HRA, Standard, Performance, LTA, Fixed</p>
                </div>
                <span className="text-right font-body-md text-primary font-medium">{INR(latestRecord.allowances)}</span>
              </div>
              <div className="grid grid-cols-2 items-center px-space-md py-3.5 hover:bg-surface-container-low/50 transition-colors bg-red-50/10">
                <span className="font-label-md text-red-600 font-semibold">Deductions Total</span>
                <span className="text-right font-body-md text-red-600 font-semibold">− {INR(latestRecord.deductions)}</span>
              </div>
              <div className="grid grid-cols-2 items-center px-space-md py-4 bg-surface-container-low/30 border-t border-border-light">
                <span className="font-headline-md text-primary font-bold text-body-lg">Net Payable</span>
                <span className="text-right font-body-md text-primary font-bold text-body-lg">{INR(latestRecord.net_pay)}</span>
              </div>
            </div>
          </div>

          {/* History Section if there are multiple records */}
          {result.data.length > 1 && (
            <div className="bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden shadow-sm">
              <div className="px-space-md py-4 border-b border-border-light bg-surface-container-low/50 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">history</span>
                <h2 className="font-headline-md text-headline-md text-primary font-bold">Payroll History</h2>
              </div>
              <div className="divide-y divide-border-light">
                {result.data.slice(1).map((record) => (
                  <div key={record.id} className="flex justify-between items-center px-space-md py-3.5 hover:bg-surface-container-low/50 transition-colors">
                    <div>
                      <p className="font-label-md text-primary font-semibold">{record.pay_period}</p>
                      <p className="text-[10px] text-secondary uppercase font-bold mt-0.5">{record.status}</p>
                    </div>
                    <span className="font-body-md text-primary font-semibold">{INR(record.net_pay)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-center font-body-sm text-secondary text-[12px] pb-8">
            This is a system-generated salary statement for reference only. For official documentation, request a payslip from HR.
          </p>

        </div>
      </main>
    </DashboardLayout>
  );
}
