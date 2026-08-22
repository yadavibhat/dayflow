import React from "react";
import { getCurrentProfile, listEmployees } from "@/lib/services/employees";
import { redirect } from "next/navigation";
import { HRPayrollClient } from "@/components/HRPayrollClient";
import { DashboardLayout } from "@/components/DashboardLayout";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HRPayrollPage() {
  // 1. Authenticate & Gating on the Server Boundary
  const { profile, error: authErr } = await getCurrentProfile();
  if (authErr || !profile) {
    redirect("/signin");
  }

  // Strictly block employees from entering the admin dashboard route
  if (profile.role === "employee") {
    return (
      <DashboardLayout>
        <main className="flex-1 p-gutter-mobile lg:p-gutter-desktop max-w-container-max mx-auto w-full">
          <div className="max-w-2xl mx-auto py-20 text-center bg-surface-container-lowest border border-border-light rounded-2xl shadow-sm px-6">
            <span className="material-symbols-outlined text-danger-text text-5xl mb-4">gpp_maybe</span>
            <h1 className="font-headline-lg text-headline-lg text-primary font-bold mb-2">Access Denied</h1>
            <p className="font-body-md text-secondary leading-relaxed mb-6">
              You do not have administrative access permissions to view this payroll administration page.
            </p>
            <Link
              href="/payroll"
              className="inline-flex items-center gap-2 bg-ink text-on-primary px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity font-bold font-label-md"
            >
              Go to My Payroll
            </Link>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  // 2. Fetch employees list
  const { employees, error: fetchErr } = await listEmployees();
  if (fetchErr) {
    return (
      <DashboardLayout>
        <main className="flex-1 p-gutter-mobile lg:p-gutter-desktop max-w-container-max mx-auto w-full">
          <div className="max-w-2xl mx-auto py-20 text-center bg-surface-container-lowest border border-border-light rounded-2xl shadow-sm px-6">
            <span className="material-symbols-outlined text-danger-text text-5xl mb-4">error</span>
            <h1 className="font-headline-lg text-headline-lg text-primary font-bold mb-2">Failed to load directory</h1>
            <p className="font-body-md text-secondary leading-relaxed mb-6">
              {fetchErr || "An unexpected error occurred while fetching the employees list."}
            </p>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  // 3. Render client-side view components
  return <HRPayrollClient employees={employees} />;
}
