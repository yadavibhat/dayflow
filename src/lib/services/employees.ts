"use server";

import { createClient } from "@/lib/supabase/server";
import { 
  Employee, 
  DbEmployee, 
  mapDbToEmployee, 
  mapEmployeeToDb
} from "@/lib/types/employee";
import { revalidatePath } from "next/cache";
import { EmployeeSelfEditSchema, EmployeeSchema } from "@/lib/validations/employee";

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

    // Server-side field allowlists — never trust the client payload shape.
    // These mirror the Zod schemas but act as an explicit pre-filter.
    const EMPLOYEE_ALLOWED_FIELDS = new Set(["phone", "address", "email", "avatar"]);
    const HR_ALLOWED_FIELDS = new Set([
      "name", "phone", "address", "email", "avatar",
      "dob", "nationality", "maritalStatus",
      "bankName", "accountNo", "routingNo", "panTaxId", "uan",
      "department", "role", "managerId", "doj",
    ]);

    const allowedFields = profile.role === "employee" ? EMPLOYEE_ALLOWED_FIELDS : HR_ALLOWED_FIELDS;

    // Detect and reject disallowed fields with a clear error
    const disallowedKeys = Object.keys(updates).filter(key => !allowedFields.has(key));
    if (disallowedKeys.length > 0) {
      return {
        success: false,
        error: `Permission Denied: Your role (${profile.role}) cannot modify: ${disallowedKeys.join(", ")}`,
      };
    }

    // Strip to allowed fields only (defense-in-depth, disallowed already rejected above)
    const scrubbedUpdates: Record<string, unknown> = {};
    for (const key of Object.keys(updates)) {
      if (allowedFields.has(key)) {
        scrubbedUpdates[key] = (updates as Record<string, unknown>)[key];
      }
    }

    // Validate the scrubbed input using Zod based on role permissions
    const schema = profile.role === "employee" ? EmployeeSelfEditSchema : EmployeeSchema;
    const validatedFields = schema.safeParse(scrubbedUpdates);
    if (!validatedFields.success) {
      const errorMsg = validatedFields.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join(", ");
      return { success: false, error: `Validation Error: ${errorMsg}` };
    }

    const filteredUpdates: Partial<Employee> = validatedFields.data as any;

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

    revalidatePath("/profile");
    revalidatePath("/employees");

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update profile" };
  }
}
