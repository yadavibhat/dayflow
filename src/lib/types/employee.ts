import { z } from "zod";

// Role type
export type UserRole = "employee" | "hr" | "admin";

// Salary structure schema
export const salaryStructureSchema = z.object({
  base: z.number().min(0),
  basicPct: z.number().min(0).max(100).default(50),
  hraPct: z.number().min(0).max(100).default(25),
  stdPct: z.number().min(0).max(100).default(10),
  pfPct: z.number().min(0).max(100).default(12),
  ptFixed: z.number().min(0).default(200),
});

export type SalaryStructure = z.infer<typeof salaryStructureSchema>;

// Database Profile row type
export interface DbProfile {
  id: string;
  email: string;
  role: UserRole;
  employee_id: string | null;
  created_at: string;
}

// Database Employee row type
export interface DbEmployee {
  id: string;
  profile_id: string | null;
  employee_code: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  department: string;
  designation: string;
  joining_date: string;
  manager_id: string | null;
  profile_photo_url: string | null;
  salary_structure: SalaryStructure | null;
  dob: string | null;
  nationality: string | null;
  marital_status: string | null;
  personal_email: string | null;
  bank_name: string | null;
  account_no: string | null;
  routing_no: string | null;
  pan_tax_id: string | null;
  uan: string | null;
  status: "Active" | "Away" | "On Leave";
  created_at: string;
  updated_at: string;
}

// Frontend Employee structure (matching Yadavi's AppContext types)
export interface Employee {
  id: string;
  profileId: string | null;
  employeeCode: string;
  name: string;
  role: string; // matches designation
  department: string;
  status: "Active" | "Away" | "On Leave";
  avatar: string; // matches profile_photo_url
  email: string; // matches personal_email
  phone: string;
  dob: string;
  nationality: string;
  maritalStatus: string;
  address: string;
  doj: string; // matches joining_date
  bankName: string;
  accountNo: string;
  routingNo: string;
  panTaxId: string;
  uan: string;
  managerId: string;
  salary: {
    base: number;
    basicPct: number;
    hraPct: number;
    stdPct: number;
    pfPct: number;
    ptFixed: number;
  };
}

// Zod schema for updating profile details (employee self-edit and HR edit validations)
export const employeeUpdateSchema = z.object({
  name: z.string().min(1, "Full name is required").optional(),
  phone: z.string().min(5, "Invalid phone number").optional().nullable(),
  address: z.string().min(5, "Address must be descriptive").optional().nullable(),
  dob: z.string().optional().nullable(),
  nationality: z.string().min(2, "Invalid nationality").optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").optional().nullable(),
  bankName: z.string().min(2, "Bank name is required").optional().nullable(),
  accountNo: z.string().min(5, "Invalid account number").optional().nullable(),
  routingNo: z.string().min(5, "Invalid Routing/IFSC code").optional().nullable(),
  panTaxId: z.string().min(5, "Invalid Tax ID").optional().nullable(),
  uan: z.string().min(5, "Invalid UAN").optional().nullable(),
});

// Mapping helpers
export function mapDbToEmployee(dbRow: DbEmployee): Employee {
  const salaryConfig = dbRow.salary_structure || {
    base: 0,
    basicPct: 50,
    hraPct: 25,
    stdPct: 10,
    pfPct: 12,
    ptFixed: 200,
  };

  return {
    id: dbRow.id,
    profileId: dbRow.profile_id,
    employeeCode: dbRow.employee_code,
    name: dbRow.full_name,
    role: dbRow.designation,
    department: dbRow.department,
    status: dbRow.status || "Active",
    avatar: dbRow.profile_photo_url || "",
    email: dbRow.personal_email || dbRow.phone || "", // Fallback
    phone: dbRow.phone || "",
    dob: dbRow.dob || "",
    nationality: dbRow.nationality || "",
    maritalStatus: dbRow.marital_status || "",
    address: dbRow.address || "",
    doj: dbRow.joining_date,
    bankName: dbRow.bank_name || "",
    accountNo: dbRow.account_no || "",
    routingNo: dbRow.routing_no || "",
    panTaxId: dbRow.pan_tax_id || "",
    uan: dbRow.uan || "",
    managerId: dbRow.manager_id || "",
    salary: {
      base: salaryConfig.base,
      basicPct: salaryConfig.basicPct,
      hraPct: salaryConfig.hraPct,
      stdPct: salaryConfig.stdPct,
      pfPct: salaryConfig.pfPct,
      ptFixed: salaryConfig.ptFixed,
    },
  };
}

export function mapEmployeeToDb(emp: Partial<Employee>): Partial<DbEmployee> {
  const dbRow: Partial<DbEmployee> = {};

  if (emp.id !== undefined) dbRow.id = emp.id;
  if (emp.profileId !== undefined) dbRow.profile_id = emp.profileId;
  if (emp.employeeCode !== undefined) dbRow.employee_code = emp.employeeCode;
  if (emp.name !== undefined) dbRow.full_name = emp.name;
  if (emp.role !== undefined) dbRow.designation = emp.role;
  if (emp.department !== undefined) dbRow.department = emp.department;
  if (emp.status !== undefined) dbRow.status = emp.status;
  if (emp.avatar !== undefined) dbRow.profile_photo_url = emp.avatar;
  if (emp.email !== undefined) dbRow.personal_email = emp.email;
  if (emp.phone !== undefined) dbRow.phone = emp.phone;
  if (emp.dob !== undefined) dbRow.dob = emp.dob;
  if (emp.nationality !== undefined) dbRow.nationality = emp.nationality;
  if (emp.maritalStatus !== undefined) dbRow.marital_status = emp.maritalStatus;
  if (emp.address !== undefined) dbRow.address = emp.address;
  if (emp.doj !== undefined) dbRow.joining_date = emp.doj;
  if (emp.bankName !== undefined) dbRow.bank_name = emp.bankName;
  if (emp.accountNo !== undefined) dbRow.account_no = emp.accountNo;
  if (emp.routingNo !== undefined) dbRow.routing_no = emp.routingNo;
  if (emp.panTaxId !== undefined) dbRow.pan_tax_id = emp.panTaxId;
  if (emp.uan !== undefined) dbRow.uan = emp.uan;
  if (emp.managerId !== undefined) dbRow.manager_id = emp.managerId;
  if (emp.salary !== undefined) {
    dbRow.salary_structure = {
      base: emp.salary.base,
      basicPct: emp.salary.basicPct,
      hraPct: emp.salary.hraPct,
      stdPct: emp.salary.stdPct,
      pfPct: emp.salary.pfPct,
      ptFixed: emp.salary.ptFixed,
    };
  }

  return dbRow;
}

// Salary components calculations helper (Stitch specifications)
export interface SalaryComponents {
  basic: number;
  hra: number;
  stdAllowance: number;
  perfBonus: number;
  lta: number;
  fixedAllowance: number;
  pfContribution: number;
  ptDeduction: number;
  netPay: number;
}

export function calculateSalaryComponents(wage: number, salary: SalaryStructure): SalaryComponents {
  const basic = (salary.basicPct / 100) * wage;
  const hra = (salary.hraPct / 100) * basic;
  const stdAllowance = (salary.stdPct / 100) * wage;
  // Others
  const perfBonus = 0; // Or based on other percentages
  const lta = 0;
  const fixedAllowance = wage - (basic + hra + stdAllowance); // Fallback to fit sum
  
  const pfContribution = (salary.pfPct / 100) * basic;
  const ptDeduction = salary.ptFixed;

  const netPay = wage - pfContribution - ptDeduction;

  return {
    basic,
    hra,
    stdAllowance,
    perfBonus,
    lta,
    fixedAllowance: Math.max(0, fixedAllowance),
    pfContribution,
    ptDeduction,
    netPay,
  };
}
