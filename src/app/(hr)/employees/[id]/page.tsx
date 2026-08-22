import React from "react";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProfileTabs } from "@/components/ProfileTabs";
import { getCurrentProfile, getEmployeeById } from "@/lib/services/employees";

// Never cache dynamic employee detail pages
export const dynamic = "force-dynamic";

interface EmployeeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const { id } = await params;

  // 1. Server-side Authorization Gate: Reject non-HR/Admin callers
  const { profile, error: authError } = await getCurrentProfile();

  if (authError || !profile) {
    redirect("/signin");
  }

  if (profile.role === "employee") {
    redirect("/dashboard"); // Gate employees from accessing other profiles
  }

  // 2. Fetch target employee details by ID from database
  const { employee, error: dbError } = await getEmployeeById(id);

  // 3. Handle Error State
  if (dbError) {
    return (
      <DashboardLayout>
        <main className="flex-1 w-full">
          <div className="max-w-xl mx-auto px-gutter-mobile md:px-gutter-desktop py-32 text-center">
            <span className="material-symbols-outlined text-danger-text text-5xl mb-4">
              error
            </span>
            <h1 className="font-headline-lg text-headline-lg text-primary font-bold mb-2">
              Failed to load profile
            </h1>
            <p className="text-secondary mb-6 font-body-md">
              There was an issue loading the employee records: {dbError}
            </p>
            <a
              href="/employees"
              className="bg-ink text-on-primary font-label-md text-label-md px-6 py-2.5 rounded hover:bg-primary transition-colors font-bold inline-block"
            >
              Back to Directory
            </a>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  // 4. Handle Empty State
  if (!employee) {
    return (
      <DashboardLayout>
        <main className="flex-1 w-full">
          <div className="max-w-xl mx-auto px-gutter-mobile md:px-gutter-desktop py-32 text-center">
            <span className="material-symbols-outlined text-secondary text-5xl mb-4 opacity-60">
              person_off
            </span>
            <h1 className="font-headline-lg text-headline-lg text-primary font-bold mb-2">
              Record Not Found
            </h1>
            <p className="text-secondary mb-6 font-body-md">
              The requested employee record does not exist or has been deleted.
            </p>
            <a
              href="/employees"
              className="bg-ink text-on-primary font-label-md text-label-md px-6 py-2.5 rounded hover:bg-primary transition-colors font-bold inline-block"
            >
              Back to Directory
            </a>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  // 5. Server-side Gate: Hide Salary Tab on detail page if caller is not HR/Admin
  // (Though they shouldn't even be here since the page itself is HR gated, we keep it consistent).
  const showSalaryTab = profile.role === "hr" || profile.role === "admin";

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto px-gutter-mobile md:px-gutter-desktop py-space-xl">
          {/* Header Link back to Directory */}
          <div className="mb-6">
            <a
              href="/employees"
              className="inline-flex items-center gap-1.5 text-secondary hover:text-primary transition-colors font-label-md text-label-md font-bold"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Directory
            </a>
          </div>

          {/* Page Header (Profile Snapshot) */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg mb-space-xl">
            <div className="flex items-center gap-space-lg">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border-light bg-surface-container shadow-sm shrink-0">
                {employee.avatar ? (
                  <img
                    alt="Profile Picture"
                    className="w-full h-full object-cover"
                    src={employee.avatar}
                  />
                ) : (
                  <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-secondary text-4xl font-bold font-sans animate-fade-in">
                    {employee.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
                  {employee.name}
                </h1>
                <p className="font-body-lg text-body-lg text-secondary mt-1">
                  {employee.role} • {employee.department} Department
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded font-label-sm text-label-sm font-bold border ${
                    employee.status === "Active"
                      ? "bg-success-soft text-success-text border-success-text/10"
                      : employee.status === "Away"
                      ? "bg-warning-soft text-warning-text border-warning-text/10"
                      : "bg-danger-soft text-danger-text border-danger-text/10"
                  }`}>
                    {employee.status}
                  </span>
                  <span className="text-secondary font-label-sm text-label-sm font-bold">
                    {employee.employeeCode}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Tabs (forced into read-only mode for detail view) */}
          <ProfileTabs
            employee={employee}
            role={profile.role}
            showSalary={showSalaryTab}
            readOnly={true}
          />
        </div>
      </main>
    </DashboardLayout>
  );
}
