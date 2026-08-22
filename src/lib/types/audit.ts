/**
 * ============================================================================
 * Dayflow HRMS — Audit Domain Types
 * ============================================================================
 */

export type AuditCategory =
  | "AUTH"
  | "ATTENDANCE"
  | "LEAVE"
  | "PROFILE"
  | "PAYROLL"
  | "SYSTEM";

export type AuditActionType =
  | "USER_SIGN_IN"
  | "USER_SIGN_UP"
  | "USER_SIGN_OUT"
  | "ATTENDANCE_CHECK_IN"
  | "ATTENDANCE_CHECK_OUT"
  | "LEAVE_REQUESTED"
  | "LEAVE_APPROVED"
  | "LEAVE_REJECTED"
  | "PROFILE_CREATED"
  | "PROFILE_UPDATED"
  | "SALARY_STRUCTURE_UPDATED"
  | "PAYSLIP_GENERATED"
  | "PAYROLL_RUN_COMPLETED"
  | "SYSTEM_INITIALIZED";

export interface AuditLogEntry {
  id: string;
  category: AuditCategory;
  action: AuditActionType | string;
  description: string;
  actorId?: string;
  actorName: string;
  actorRole?: "admin" | "employee" | "hr" | "system";
  targetEntity?: string; // e.g. "Employee", "LeaveRequest", "AttendanceLog", "SalaryProfile"
  targetId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  timestamp: string; // ISO string
}

export interface AuditQueryFilters {
  category?: AuditCategory | "ALL";
  actorName?: string;
  targetEntity?: string;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}
