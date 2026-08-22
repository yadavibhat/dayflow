import { z } from "zod";

// Salary Profile Component Validation Contract
export const salaryProfileSchema = z.object({
  base: z.number().nonnegative("Base salary must be non-negative"),
  basicPct: z.number().min(0).max(100, "Percentage must be between 0 and 100"),
  hraPct: z.number().min(0).max(100, "Percentage must be between 0 and 100"),
  stdPct: z.number().min(0).max(100, "Percentage must be between 0 and 100"),
  pfPct: z.number().min(0).max(100, "Percentage must be between 0 and 100"),
  ptFixed: z.number().nonnegative("PT Deductible must be non-negative"),
});

// Employee Registration & Profile Validation Contract
export const employeeSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.string().min(2, "Job Role must be at least 2 characters"),
  department: z.enum(["Design", "Engineering", "Marketing", "Finance", "HR"]),
  status: z.enum(["Active", "Away", "On Leave"]),
  avatar: z.string().or(z.literal("")),
  email: z.string().email("Invalid email address format"),
  phone: z.string().min(5, "Phone number is too short").or(z.literal("")),
  dob: z.string().min(1, "Date of birth is required"),
  nationality: z.string().min(1, "Nationality is required"),
  maritalStatus: z.string().min(1, "Marital status is required"),
  address: z.string().min(1, "Address is required"),
  doj: z.string().min(1, "Date of joining is required"),
  bankName: z.string().min(1, "Bank name is required"),
  accountNo: z.string().min(4, "Account number is too short"),
  routingNo: z.string().min(1, "Routing number is required"),
  panTaxId: z.string().min(1, "PAN/Tax ID is required"),
  uan: z.string().min(1, "UAN is required"),
  salary: salaryProfileSchema,
});

// Attendance Log Record Validation Contract
export const attendanceLogSchema = z.object({
  id: z.string().min(1, "Record ID is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  employeeName: z.string().min(2, "Employee Name is required"),
  checkIn: z.string(),
  checkOut: z.string(),
  workHours: z.string(),
  extraHours: z.string(),
  status: z.enum(["Present", "Late", "On Leave"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

// Leave Request Form Validation Contract
export const leaveRequestSchema = z.object({
  id: z.string().min(1, "Request ID is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  employeeName: z.string().min(2, "Employee Name is required"),
  department: z.string().min(1, "Department is required"),
  type: z.string().min(2, "Leave type is required"),
  dates: z.string().min(2, "Date range is required"),
  days: z.number().positive("Duration must be a positive number"),
  status: z.enum(["Pending", "Approved", "Rejected"]),
  avatar: z.string().or(z.literal("")),
});

// Audit Trail Activity Validation Contract
export const auditLogSchema = z.object({
  id: z.string().min(1, "Log ID is required"),
  user: z.string().min(1, "User identifier is required"),
  action: z.string().min(1, "Action description is required"),
  timestamp: z.string(),
  ipAddress: z.string(),
});

// TypeScript Domain Types Inferred from Contracts
export type SalaryProfile = z.infer<typeof salaryProfileSchema>;
export type Employee = z.infer<typeof employeeSchema>;
export type AttendanceLog = z.infer<typeof attendanceLogSchema>;
export type LeaveRequest = z.infer<typeof leaveRequestSchema>;
export type AuditLog = z.infer<typeof auditLogSchema>;
