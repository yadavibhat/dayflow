"use server";

import { createClient } from "@/lib/supabase/server";
import { PayrollRecord, SalaryComponents } from "../lib/types/payroll_audit";
import { calculateSalary } from "../lib/payroll/calculations";
import { getCurrentProfile } from "@/lib/services/employees";
import { writeAuditLog } from "./audit";

/**
 * Fetches the caller's own payroll records (Employee role).
 */
export async function fetchOwnPayroll() {
  try {
    const supabase = await createClient();
    const { profile, error: authErr } = await getCurrentProfile();
    if (authErr || !profile) {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("payroll")
      .select("*")
      .eq("employee_id", profile.id)
      .order("pay_period", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch payroll" };
  }
}

/**
 * Fetches all payroll records. HR/Admin only.
 */
export async function fetchAllPayrollForHR() {
  try {
    const supabase = await createClient();
    const { profile, error: authErr } = await getCurrentProfile();
    if (authErr || !profile) {
      return { success: false, error: "Unauthorized" };
    }

    if (profile.role === "employee") {
      return { success: false, error: "Access Denied: HR or Admin role required" };
    }

    const { data, error } = await supabase
      .from("payroll")
      .select("*")
      .order("pay_period", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch payroll records" };
  }
}

/**
 * Upserts salary components for an employee (HR only).
 * Calls the calculation function server-side before writing.
 */
export async function upsertSalaryComponents(employeeId: string, components: SalaryComponents) {
  try {
    const supabase = await createClient();
    const { profile, error: authErr } = await getCurrentProfile();
    if (authErr || !profile) {
      return { success: false, error: "Unauthorized" };
    }

    if (profile.role === "employee") {
      return { success: false, error: "Access Denied: HR or Admin role required" };
    }

    // Call pure calculations function server-side
    const computed = calculateSalary(components);

    // Fetch existing employee to record pre-mutation state
    const { data: existingEmp } = await supabase
      .from("employees")
      .select("salary_structure")
      .eq("id", employeeId)
      .maybeSingle();

    // Write to employees table (storing inside salary_structure)
    const { error: updateErr } = await supabase
      .from("employees")
      .update({
        salary_structure: {
          ...components,
          computed,
        },
      })
      .eq("id", employeeId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Write audit log
    await writeAuditLog(
      profile.id,
      "employees",
      employeeId,
      "SALARY_STRUCTURE_UPDATED",
      existingEmp?.salary_structure || null,
      { ...components, computed }
    );

    return { success: true, computed };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to upsert salary components" };
  }
}
