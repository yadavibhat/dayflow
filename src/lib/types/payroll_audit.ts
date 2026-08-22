/**
 * Payroll Record mirroring the payroll database table exactly.
 */
export interface PayrollRecord {
  id: string;
  employee_id: string;
  pay_period: string; // e.g. "2026-08"
  basic: number;
  allowances: number;
  deductions: number;
  net_pay: number;
  status: "Draft" | "Generated" | "Paid" | "Cancelled";
  updated_at: string;
}

/**
 * Salary Components config.
 */
export interface SalaryComponents {
  wage: number;
  workingDaysPerWeek: number;
  breakTimeMinutes: number;
  basicPct: number;
  hraPct: number;
  standardAllowancePct: number;
  performanceBonusPct: number;
  ltaPct: number;
  fixedAllowancePct: number;
  employeePfPct: number;
  employerPfPct: number;
  professionalTax: number;
}

/**
 * Audit Log Entry mirroring the audit_logs table exactly.
 */
export interface AuditLogEntry {
  id: string;
  actor_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  before_json: any;
  after_json: any;
  created_at: string;
}
