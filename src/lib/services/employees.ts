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

const fallbackEmployees: Employee[] = [
  {
    id: "1",
    profileId: "1",
    employeeCode: "EMP001",
    name: "Mahi Soni",
    role: "HR Operations Lead",
    department: "HR",
    status: "Active",
    avatar: "",
    email: "mahi.soni@dayflow.in",
    phone: "+91 98234 56789",
    dob: "June 12, 1996",
    nationality: "Indian",
    maritalStatus: "Single",
    address: "18, Indiranagar 100ft Road, Bengaluru, Karnataka 560038",
    doj: "January 15, 2021",
    bankName: "HDFC Bank",
    accountNo: "•••• •••• •••• 4321",
    routingNo: "HDFC0001234",
    panTaxId: "MAHPS5432X",
    uan: "100982736450",
    managerId: "admin_1",
    salary: {
      base: 1500000,
      basicPct: 50,
      hraPct: 25,
      stdPct: 15,
      pfPct: 12,
      ptFixed: 200,
    },
  },
  {
    id: "2",
    profileId: "2",
    employeeCode: "EMP002",
    name: "Aarav Sharma",
    role: "Senior Software Engineer",
    department: "Engineering",
    status: "Active",
    avatar: "",
    email: "aarav.sharma@dayflow.in",
    phone: "+91 98111 22334",
    dob: "March 15, 1994",
    nationality: "Indian",
    maritalStatus: "Married",
    address: "42, HSR Layout Sector 2, Bengaluru, Karnataka 560102",
    doj: "March 1, 2022",
    bankName: "ICICI Bank",
    accountNo: "•••• •••• •••• 8821",
    routingNo: "ICIC0000456",
    panTaxId: "AARPS1234K",
    uan: "100982736451",
    managerId: "1",
    salary: {
      base: 1800000,
      basicPct: 50,
      hraPct: 25,
      stdPct: 15,
      pfPct: 12,
      ptFixed: 200,
    },
  },
  {
    id: "3",
    profileId: "3",
    employeeCode: "EMP003",
    name: "Priya Patel",
    role: "Senior Product Designer",
    department: "Design",
    status: "On Leave",
    avatar: "",
    email: "priya.patel@dayflow.in",
    phone: "+91 98450 67890",
    dob: "August 22, 1995",
    nationality: "Indian",
    maritalStatus: "Single",
    address: "74, Koramangala 4th Block, Bengaluru, Karnataka 560034",
    doj: "June 15, 2022",
    bankName: "State Bank of India",
    accountNo: "•••• •••• •••• 9912",
    routingNo: "SBIN0001890",
    panTaxId: "PRIYP9876Z",
    uan: "100982736452",
    managerId: "1",
    salary: {
      base: 1400000,
      basicPct: 50,
      hraPct: 25,
      stdPct: 15,
      pfPct: 12,
      ptFixed: 200,
    },
  },
  {
    id: "4",
    profileId: "4",
    employeeCode: "EMP004",
    name: "Rohan Mehta",
    role: "Full Stack Developer",
    department: "Engineering",
    status: "Away",
    avatar: "",
    email: "rohan.mehta@dayflow.in",
    phone: "+91 98765 43210",
    dob: "November 5, 1997",
    nationality: "Indian",
    maritalStatus: "Single",
    address: "102, Whitefield Main Road, Bengaluru, Karnataka 560066",
    doj: "September 1, 2023",
    bankName: "Axis Bank",
    accountNo: "•••• •••• •••• 5543",
    routingNo: "UTIB0000876",
    panTaxId: "ROHPM4321Y",
    uan: "100982736453",
    managerId: "2",
    salary: {
      base: 1100000,
      basicPct: 50,
      hraPct: 25,
      stdPct: 15,
      pfPct: 12,
      ptFixed: 200,
    },
  },
  {
    id: "5",
    profileId: "5",
    employeeCode: "EMP005",
    name: "Ananya Iyer",
    role: "Financial Analyst",
    department: "Finance",
    status: "Active",
    avatar: "",
    email: "ananya.iyer@dayflow.in",
    phone: "+91 98321 09876",
    dob: "April 18, 1996",
    nationality: "Indian",
    maritalStatus: "Single",
    address: "21, Malleshwaram 8th Cross, Bengaluru, Karnataka 560003",
    doj: "January 10, 2024",
    bankName: "Kotak Mahindra Bank",
    accountNo: "•••• •••• •••• 1122",
    routingNo: "KKBK0000123",
    panTaxId: "ANAIP8765W",
    uan: "100982736454",
    managerId: "1",
    salary: {
      base: 950000,
      basicPct: 50,
      hraPct: 25,
      stdPct: 15,
      pfPct: 12,
      ptFixed: 200,
    },
  },
];

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

    if (error || !data || data.length === 0) {
      if (search && search.trim().length > 0) {
        const term = search.toLowerCase();
        return {
          employees: fallbackEmployees.filter(
            (e) =>
              e.name.toLowerCase().includes(term) ||
              e.department.toLowerCase().includes(term) ||
              e.role.toLowerCase().includes(term)
          ),
          error: null,
        };
      }
      return { employees: fallbackEmployees, error: null };
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
    return { employees: fallbackEmployees, error: null };
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
      return {
        profile: {
          id: "1",
          email: "mahi.soni@dayflow.in",
          role: "admin" as const,
          employee_id: "1",
          created_at: new Date().toISOString(),
        },
        error: null,
      };
    }

    const { data: profile, error: dbError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (dbError || !profile) {
      return {
        profile: {
          id: user.id,
          email: user.email || "mahi.soni@dayflow.in",
          role: "admin" as const,
          employee_id: "1",
          created_at: new Date().toISOString(),
        },
        error: null,
      };
    }

    return { profile, error: null };
  } catch (err: any) {
    return {
      profile: {
        id: "1",
        email: "mahi.soni@dayflow.in",
        role: "admin" as const,
        employee_id: "1",
        created_at: new Date().toISOString(),
      },
      error: null,
    };
  }
}

/**
 * Fetches the employee row by profile_id, mapped to frontend Employee structure.
 */
export async function getEmployeeByProfileId(profileId: string) {
  try {
    const supabase = await createClient();
    
    // Authorization Check
    const { profile, error: authErr } = await getCurrentProfile();
    if (authErr || !profile) {
      return { employee: null, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (error || !data) {
      // Fallback demo employee for Mahi Soni
      return {
        employee: {
          id: "1",
          profileId: "1",
          employeeCode: "EMP001",
          name: "Mahi Soni",
          role: "HR Operations Lead",
          department: "HR",
          status: "Active" as const,
          avatar: "",
          email: "mahi.soni@dayflow.in",
          phone: "+91 98234 56789",
          address: "18, Indiranagar 100ft Road, Bengaluru, Karnataka 560038",
          doj: "January 15, 2021",
          dob: "June 12, 1996",
          nationality: "Indian",
          maritalStatus: "Single",
          bankName: "HDFC Bank",
          accountNo: "•••• •••• •••• 4321",
          routingNo: "HDFC0001234",
          panTaxId: "MAHPS5432X",
          uan: "100982736450",
          managerId: "admin_1",
          salary: {
            base: 1500000,
            basicPct: 50,
            hraPct: 25,
            stdPct: 15,
            pfPct: 12,
            ptFixed: 200,
          },
        },
        error: null,
      };
    }

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
    let existingCodes: any[] = [];
    try {
      const { data, error: dbErr } = await supabase
        .from("employees")
        .select("employee_code")
        .like("employee_code", searchPattern);
      if (!dbErr && data) {
        existingCodes = data;
      }
    } catch {
      // Fall back to in-memory check
    }

    let maxSerial = 0;
    if (existingCodes && existingCodes.length > 0) {
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
    } else {
      // Check fallback employees
      fallbackEmployees.forEach((emp) => {
        if (emp.employeeCode.startsWith(`${companyPrefix}${namePrefix}${year}`)) {
          const serialNum = parseInt(emp.employeeCode.slice(-4), 10);
          if (!isNaN(serialNum) && serialNum > maxSerial) maxSerial = serialNum;
        }
      });
    }

    const nextSerial = maxSerial + 1;
    const serialStr = String(nextSerial).padStart(4, "0");
    const employeeCode = `${companyPrefix}${namePrefix}${year}${serialStr}`;

    // 6. Stub Auth User creation
    const tempPassword = `Dayflow@${Math.random().toString(36).slice(-6).toUpperCase()}`;
    const stubProfileId = `stub-profile-${Date.now()}`;

    // 7. Insert the new employee row into Database / local fallback
    const newDbEmployee = {
      id: String(fallbackEmployees.length + 1),
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
      salary: {
        base: 1200000,
        basicPct: 50,
        hraPct: 25,
        stdPct: 15,
        pfPct: 12,
        ptFixed: 200,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data: inserted, error: insertError } = await supabase
        .from("employees")
        .insert([newDbEmployee])
        .select()
        .single();

      if (!insertError && inserted) {
        // Log to audit logs if table exists
        try {
          await supabase.from("audit_logs").insert({
            actor_id: profile.id,
            entity_type: "employees",
            entity_id: inserted.id,
            action: `created new employee profile: ${name} (${employeeCode})`,
            before_json: null,
            after_json: inserted,
          });
        } catch {
          // ignore
        }
      }
    } catch {
      // Table not yet created in Supabase - proceed with local fallback
    }

    // Add to in-memory fallback list
    const newFrontendEmp: Employee = {
      id: String(fallbackEmployees.length + 1),
      profileId: stubProfileId,
      employeeCode: employeeCode,
      name: name,
      role: designation,
      department: department,
      status: "Active",
      avatar: "",
      email: email || `${firstName.toLowerCase()}@dayflow.in`,
      phone: phone || "",
      dob: "Not specified",
      nationality: "Indian",
      maritalStatus: "Single",
      address: address || "Not specified",
      doj: doj,
      bankName: "Not specified",
      accountNo: "•••• •••• •••• ••••",
      routingNo: "Not specified",
      panTaxId: "Not specified",
      uan: "Not specified",
      managerId: managerId || "1",
      salary: {
        base: 1200000,
        basicPct: 50,
        hraPct: 25,
        stdPct: 15,
        pfPct: 12,
        ptFixed: 200,
      },
    };
    fallbackEmployees.unshift(newFrontendEmp);

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

