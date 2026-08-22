"use server";

import { createClient } from "@/lib/supabase/server";
import { 
  Employee, 
  DbEmployee, 
  mapDbToEmployee, 
  mapEmployeeToDb, 
  employeeUpdateSchema 
} from "@/lib/types/employee";

/**
 * Fetches the currently authenticated profile from Supabase Auth & profiles table.
 */
export async function getCurrentProfile() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { profile: null, error: "Unauthorized" };
    }

    const { data: profile, error: dbError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (dbError || !profile) {
      return { profile: null, error: "Profile not found" };
    }

    return { profile, error: null };
  } catch (err: any) {
    return { profile: null, error: err.message || "Failed to fetch profile" };
  }
}

/**
 * Fetches the employee row by profile_id, mapped to frontend Employee structure.
 */
export async function getEmployeeByProfileId(profileId: string) {
  try {
    const supabase = await createClient();
    
    // Authorization Check: Normal employees can only view their own record
    const { profile, error: authErr } = await getCurrentProfile();
    if (authErr || !profile) {
      return { employee: null, error: "Unauthorized" };
    }

    if (profile.role === "employee" && profile.id !== profileId) {
      return { employee: null, error: "Access Denied: You can only view your own profile" };
    }

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("profile_id", profileId)
      .maybeSingle(); // Use maybeSingle to handle empty records without crashing

    if (error) {
      return { employee: null, error: error.message };
    }

    if (!data) {
      // Return null employee but no error, indicating empty onboarding state
      return { employee: null, error: null };
    }

    // Map and return standard camelCase structure
    const employee = mapDbToEmployee(data as DbEmployee);
    return { employee, error: null };
  } catch (err: any) {
    return { employee: null, error: err.message || "Failed to fetch employee details" };
  }
}

/**
 * Updates an employee's details in the database.
 * Validates updates against Zod schema and enforces server-side role permissions.
 */
export async function updateEmployeeProfile(employeeId: string, updates: Partial<Employee>) {
  try {
    const supabase = await createClient();

    // Verify authentication and role
    const { profile, error: authErr } = await getCurrentProfile();
    if (authErr || !profile) {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch the target employee record first to verify ownership
    const { data: targetEmp, error: fetchErr } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .single();

    if (fetchErr || !targetEmp) {
      return { success: false, error: "Employee record not found" };
    }

    // Enforce permission checks:
    // - Employees can only edit their own profile
    if (profile.role === "employee" && targetEmp.profile_id !== profile.id) {
      return { success: false, error: "Access Denied: You can only edit your own details" };
    }

    // Validate the input using Zod
    const validatedFields = employeeUpdateSchema.safeParse(updates);
    if (!validatedFields.success) {
      const errorMsg = validatedFields.error.issues.map(issue => issue.message).join(", ");
      return { success: false, error: `Validation Error: ${errorMsg}` };
    }

    const filteredUpdates: Partial<Employee> = validatedFields.data as any;

    // Enforce field-level write permissions:
    // Normal employees are NEVER allowed to edit core administrative or payroll fields.
    // Ensure we delete any accidental edits of: role (designation), department, employeeCode, or salary structure
    if (profile.role === "employee") {
      delete filteredUpdates.role;
      delete filteredUpdates.department;
      delete filteredUpdates.employeeCode;
      delete (filteredUpdates as any).salary;
    }

    const dbUpdates = mapEmployeeToDb(filteredUpdates);
    
    // Add updated_at timestamp
    dbUpdates.updated_at = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("employees")
      .update(dbUpdates)
      .eq("id", employeeId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log this action to audit logs
    const actorName = profile.role === "employee" ? targetEmp.full_name : "HR Admin";
    await supabase.from("audit_logs").insert({
      actor_id: profile.id,
      entity_type: "employees",
      entity_id: employeeId,
      action: `updated profile information: ${Object.keys(filteredUpdates).join(", ")}`,
      before_json: targetEmp,
      after_json: { ...targetEmp, ...dbUpdates }
    });

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update profile" };
  }
}
