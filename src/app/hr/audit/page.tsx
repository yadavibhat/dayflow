import React from "react";
import { getCurrentProfile } from "@/lib/services/employees";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HRAuditClient } from "@/components/HRAuditClient";
import { DashboardLayout } from "@/components/DashboardLayout";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HRAuditPage() {
  // 1. Server-side Authentication & Gating
  const { profile, error: authErr } = await getCurrentProfile();
  if (authErr || !profile) {
    redirect("/signin");
  }

  if (profile.role === "employee") {
    return (
      <DashboardLayout>
        <main className="flex-1 p-gutter-mobile lg:p-gutter-desktop max-w-container-max mx-auto w-full">
          <div className="max-w-2xl mx-auto py-20 text-center bg-surface-container-lowest border border-border-light rounded-2xl shadow-sm px-6">
            <span className="material-symbols-outlined text-danger-text text-5xl mb-4">gpp_maybe</span>
            <h1 className="font-headline-lg text-headline-lg text-primary font-bold mb-2">Access Denied</h1>
            <p className="font-body-md text-secondary leading-relaxed mb-6">
              You do not have administrative access permissions to view the system audit logs.
            </p>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  const supabase = await createClient();

  // 2. Fetch pending leave count (status = 'Pending') from leaves table
  const { count: pendingLeaveCount, error: leavesErr } = await supabase
    .from("leaves")
    .select("id", { count: "exact", head: true })
    .eq("status", "Pending");

  if (leavesErr) {
    console.error("Failed to query leaves count:", leavesErr.message);
  }

  // 3. Fetch draft payroll rows count (status = 'Draft') from payroll table
  const { count: draftPayrollCount, error: payrollErr } = await supabase
    .from("payroll")
    .select("id", { count: "exact", head: true })
    .eq("status", "Draft");

  if (payrollErr) {
    console.error("Failed to query payroll status count:", payrollErr.message);
  }

  // 4. Fetch all audit logs chronological descending
  const { data: auditLogs, error: fetchErr } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (fetchErr) {
    return (
      <DashboardLayout>
        <main className="flex-1 p-gutter-mobile lg:p-gutter-desktop max-w-container-max mx-auto w-full">
          <div className="max-w-2xl mx-auto py-20 text-center bg-surface-container-lowest border border-border-light rounded-2xl shadow-sm px-6">
            <span className="material-symbols-outlined text-danger-text text-5xl mb-4">error</span>
            <h1 className="font-headline-lg text-headline-lg text-primary font-bold mb-2">Failed to load logs</h1>
            <p className="font-body-md text-secondary leading-relaxed mb-6">
              {fetchErr.message || "An unexpected error occurred while fetching system logs."}
            </p>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  // 5. Render client-side view components
  return (
    <HRAuditClient
      initialLogs={auditLogs || []}
      pendingLeaveCount={pendingLeaveCount || 0}
      draftPayrollCount={draftPayrollCount || 0}
    />
  );
}
