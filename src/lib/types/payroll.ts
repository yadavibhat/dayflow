import { z } from "zod";

/**
 * ============================================================================
 * Dayflow HRMS — Payroll Domain Types
 * ============================================================================
 */

export interface SalaryComponent {
  code: string;
  name: string;
  type: "earning" | "deduction";
  percentage?: number;
  amount: number;
  description?: string;
}

export interface ComputedSalaryBreakdown {
  baseSalary: number;
  monthlyBase: number;
  earnings: {
    basic: number;
    hra: number;
    standardAllowance: number;
    specialAllowance: number;
    totalEarnings: number;
  };
  deductions: {
    providentFund: number;
    professionalTax: number;
    taxDeductedAtSource: number;
    totalDeductions: number;
  };
  netMonthlyPay: number;
  annualCtc: number;
  allocationPercentage: number;
}

export type PayslipStatus = "Draft" | "Generated" | "Paid" | "Cancelled";

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  bankName?: string;
  accountNo?: string;
  panTaxId?: string;
  period: string; // e.g. "August 2026"
  periodMonth: number; // 1-12
  periodYear: number;
  totalWorkingDays: number;
  daysPresent: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  basicSalary: number;
  hra: number;
  standardAllowance: number;
  specialAllowance: number;
  grossEarnings: number;
  pfDeduction: number;
  ptDeduction: number;
  tdsDeduction: number;
  unpaidLeaveDeduction: number;
  totalDeductions: number;
  netPayable: number;
  status: PayslipStatus;
  generatedAt: string;
  paidAt?: string;
}

export type PayrollRunStatus = "Draft" | "Processing" | "Completed" | "Locked";

export interface PayrollRunBatch {
  id: string;
  period: string;
  month: number;
  year: number;
  totalEmployees: number;
  totalGrossPayable: number;
  totalDeductions: number;
  totalNetDisbursed: number;
  status: PayrollRunStatus;
  processedBy: string;
  processedAt: string;
  payslips: Payslip[];
}
