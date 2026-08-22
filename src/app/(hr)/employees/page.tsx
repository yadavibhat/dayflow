import React from "react";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { EmployeeDirectoryClient } from "@/components/EmployeeDirectoryClient";
import { getCurrentProfile, listEmployees } from "@/lib/services/employees";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  // 1. Server-side Gate: Redirect unauthenticated or unauthorized users
  const { profile, error: authError } = await getCurrentProfile();

  if (authError || !profile) {
    redirect("/signin");
  }

  // Reject employee role server-side immediately
  if (profile.role === "employee") {
    redirect("/dashboard"); // Or show an unauthorized page / access denied
  }

  // 2. Load employees list using server service layer (real database records)
  const { employees, error: dbError } = await listEmployees();

  if (dbError) {
    return (
      <DashboardLayout>
        <main className="flex-1 w-full">
          <div className="max-w-xl mx-auto px-gutter-mobile md:px-gutter-desktop py-32 text-center">
            <span className="material-symbols-outlined text-danger-text text-5xl mb-4">
              error
            </span>
            <h1 className="font-headline-lg text-headline-lg text-primary font-bold mb-2">
              Failed to load directory
            </h1>
            <p className="text-secondary mb-6 font-body-md">
              There was an issue loading the employee records: {dbError}
            </p>
            <a
              href="/employees"
              className="bg-ink text-on-primary font-label-md text-label-md px-6 py-2.5 rounded hover:bg-primary transition-colors font-bold inline-block"
            >
              Retry Connection
            </a>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto px-gutter-mobile md:px-gutter-desktop py-space-xl">
          <EmployeeDirectoryClient employees={employees} />
        </div>
      </main>
    </DashboardLayout>
  );
}
