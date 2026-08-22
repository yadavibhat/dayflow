"use server";

import { createClient } from "@/lib/supabase/server";
import { 
  Employee, 
  DbEmployee, 
  mapDbToEmployee, 
  mapEmployeeToDb
} from "@/lib/types/employee";
import { revalidatePath } from "next/cache";
import { EmployeeSelfEditSchema, EmployeeSchema, EmployeeCreateSchema } from "@/lib/validations/employee";

/**
 * Fetches all employees. HR/Admin only — employees cannot list the full directory.
 * Supports optional search filtering by name, department, or designation.
 */
export async function listEmployees(search?: string) {
  try {
    const supabase = await createClient();

    // Re-derive caller's role from session — never trust client claims
    const { profile, error: authErr } = await getCurrentProfile();
    if (authErr || !profile) {
      return { employees: [], error: "Unauthorized" };
    }

    if (profile.role === "employee") {
      return { employees: [], error: "Access Denied: HR or Admin role required" };
    }

    let query = supabase.from("employees").select("*").order("full_name", { ascending: true });

    // Server-side search filtering using Supabase ilike
    if (search && search.trim().length > 0) {
      const term = `%${search.trim()}%`;
      query = query.or(`full_name.ilike.${term},department.ilike.${term},designation.ilike.${term}`);
    }

    const { data, error } = await query;

    if (error) {
      return { employees: [], error: error.message };
    }

    // Fetch today's attendance records to attach status dots
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: attendanceData } = await supabase
      .from("attendance")
      .select("employee_id, status")
      .eq("date", todayStr);

    const attendanceMap = new Map<string, string>();
    attendanceData?.forEach((att) => {
      if (att.employee_id && att.status) {
        attendanceMap.set(att.employee_id, att.status);
      }
    });

    const employees = (data || []).map((row) => {
      const emp = mapDbToEmployee(row as DbEmployee);
      emp.todayStatus = attendanceMap.get(emp.id) || null;
      return emp;
    });

    return { employees, error: null };
  } catch (err: any) {
    return { employees: [], error: err.message || "Failed to fetch employees" };
  }
}

/**
 * Fetches a single employee by their row ID. HR/Admin only.
 */
export async function getEmployeeById(employeeId: string) {
  try {
    const supabase = await createClient();

    const { profile, error: authErr } = await getCurrentProfile();
    if (authErr || !profile) {
      return { employee: null, error: "Unauthorized" };
    }

    if (profile.role === "employee") {
      return { employee: null, error: "Access Denied: HR or Admin role required" };
    }

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .maybeSingle();

    if (error) {
      return { employee: null, error: error.message };
    }

    if (!data) {
      return { employee: null, error: "Employee not found" };
    }

    const employee = mapDbToEmployee(data as DbEmployee);
    return { employee, error: null };
  } catch (err: any) {
    return { employee: null, error: err.message || "Failed to fetch employee" };
  }
}


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

/**
 * Creates a new employee profile and underlying auth credentials.
 * HR/Admin only — restricted server-side.
 */
export async function createEmployee(data: any) {
  try {
    const supabase = await createClient();

    // 1. Server-side Gate: Authorize caller role
    const { profile, error: authErr } = await getCurrentProfile();
    if (authErr || !profile) {
      return { success: false, error: "Unauthorized" };
    }

    if (profile.role === "employee") {
      return { success: false, error: "Access Denied: HR or Admin role required" };
    }

    // 2. Validate form fields using Zod
    const validated = EmployeeCreateSchema.safeParse(data);
    if (!validated.success) {
      const errorMsg = validated.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join(", ");
      return { success: false, error: `Validation Error: ${errorMsg}` };
    }

    const { name, phone, department, role: designation, doj, managerId, address, email } = validated.data;

    // 3. Parse joining year from Date of Joining (doj)
    let year = new Date().getFullYear();
    if (doj.includes("-")) {
      const parsed = new Date(doj);
      if (!isNaN(parsed.getTime())) {
        year = parsed.getFullYear();
      }
    } else {
      const yearMatch = doj.match(/\b\d{4}\b/);
      if (yearMatch) {
        year = parseInt(yearMatch[0], 10);
      }
    }

    // 4. Generate first 2 letters of company name + first 2 letters of (first name + last name)
    const companyPrefix = "DA"; // "DA" from Dayflow
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : firstName;
    const namePrefix = (firstName.slice(0, 2) + lastName.slice(0, 2)).toUpperCase().padEnd(4, "X");

    // 5. Query max serial number for that year to increment
    const searchPattern = `${companyPrefix}${namePrefix}${year}%`;
    const { data: existingCodes, error: dbErr } = await supabase
      .from("employees")
      .select("employee_code")
      .like("employee_code", searchPattern);

    if (dbErr) {
      return { success: false, error: `Database error querying employee codes: ${dbErr.message}` };
    }

    let maxSerial = 0;
    if (existingCodes) {
      for (const row of existingCodes) {
        const code = row.employee_code;
        if (code && code.length === 14) {
          const codeYear = code.substring(6, 10);
          if (codeYear === String(year)) {
            const serialStr = code.substring(10, 14);
            const serialNum = parseInt(serialStr, 10);
            if (!isNaN(serialNum) && serialNum > maxSerial) {
              maxSerial = serialNum;
            }
          }
        }
      }
    }

    const nextSerial = maxSerial + 1;
    const serialStr = String(nextSerial).padStart(4, "0");
    const employeeCode = `${companyPrefix}${namePrefix}${year}${serialStr}`;

    // Defensively check for duplicate employee code
    const { data: duplicateCheck } = await supabase
      .from("employees")
      .select("id")
      .eq("employee_code", employeeCode)
      .maybeSingle();

    if (duplicateCheck) {
      return { success: false, error: `System Error: Generated employee code ${employeeCode} already exists.` };
    }

    // 6. Stub Auth User creation (dependency on Yadavi's auth module)
    // We generate a Login ID (same as employeeCode) and a temporary password.
    // In a production build, this would invoke Yadavi's createAuthUser helper.
    const tempPassword = `Dayflow@${Math.random().toString(36).slice(-6).toUpperCase()}`;
    const stubProfileId = `stub-profile-${Date.now()}`;

    // 7. Insert the new employee row into Database
    const newDbEmployee = {
      profile_id: stubProfileId,
      employee_code: employeeCode,
      full_name: name,
      phone: phone || null,
      address: address || null,
      department: department,
      designation: designation,
      joining_date: doj,
      manager_id: managerId || null,
      status: "Active",
      salary_structure: {
        base: 50000, // Default base salary structure
        basicPct: 50,
        hraPct: 25,
        stdPct: 10,
        pfPct: 12,
        ptFixed: 200,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await supabase
      .from("employees")
      .insert([newDbEmployee])
      .select()
      .single();

    if (insertError) {
      return { success: false, error: `Failed to insert employee: ${insertError.message}` };
    }

    // Log to audit logs
    await supabase.from("audit_logs").insert({
      actor_id: profile.id,
      entity_type: "employees",
      entity_id: inserted.id,
      action: `created new employee profile: ${name} (${employeeCode})`,
      before_json: null,
      after_json: inserted,
    });

    revalidatePath("/employees");

    return {
      success: true,
      error: null,
      credentials: {
        loginId: employeeCode,
        password: tempPassword,
        employeeCode,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create employee" };
  }
}

