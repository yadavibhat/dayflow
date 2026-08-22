/**
 * ============================================================================
 * Dayflow HRMS — Core Payroll Domain Service Boundary
 * ============================================================================
 * 
 * DOMAIN RESPONSIBILITIES:
 * - Deterministic computation of salary breakdowns (Basic, HRA, Allowances, PF, PT, TDS).
 * - Payslip generation based on working days, attendance logs, and unpaid leave days.
 * - Payroll run batch calculation and aggregation.
 */

import { ComputedSalaryBreakdown, Payslip } from "@/lib/types/payroll";
import { SalaryStructureConfig, SalaryStructureConfigSchema } from "@/lib/validations/payroll";
import { Employee, AttendanceLog, LeaveRequest } from "@/lib/validations/schemas";
import { format } from "date-fns";

/**
 * Computes the complete salary breakdown given an annual or monthly base salary and allocation percentages.
 */
export function calculateSalaryBreakdown(
  baseSalary: number,
  config?: Partial<SalaryStructureConfig>
): ComputedSalaryBreakdown {
  const basicPct = config?.basicPct ?? 50;
  const hraPct = config?.hraPct ?? 25;
  const stdPct = config?.stdPct ?? 15;
  const specialPct = config?.specialPct ?? (100 - basicPct - hraPct - stdPct);
  const pfPct = config?.pfPct ?? 12;
  const ptFixed = config?.ptFixed ?? 200;
  const tdsMonthly = config?.tdsMonthly ?? 0;

  const monthlyBase = baseSalary / 12;

  // Earnings
  const basic = monthlyBase * (basicPct / 100);
  const hra = monthlyBase * (hraPct / 100);
  const standardAllowance = monthlyBase * (stdPct / 100);
  const specialAllowance = monthlyBase * (specialPct / 100);
  const totalEarnings = basic + hra + standardAllowance + specialAllowance;

  // Deductions
  const providentFund = basic * (pfPct / 100);
  const professionalTax = ptFixed;
  const totalDeductions = providentFund + professionalTax + tdsMonthly;

  // Net
  const netMonthlyPay = Math.max(0, totalEarnings - totalDeductions);
  const annualCtc = baseSalary;
  const allocationPercentage = basicPct + hraPct + stdPct + specialPct;

  return {
    baseSalary,
    monthlyBase,
    earnings: {
      basic,
      hra,
      standardAllowance,
      specialAllowance,
      totalEarnings,
    },
    deductions: {
      providentFund,
      professionalTax,
      taxDeductedAtSource: tdsMonthly,
      totalDeductions,
    },
    netMonthlyPay,
    annualCtc,
    allocationPercentage,
  };
}

/**
 * Generates an itemized monthly payslip for an employee.
 */
export function generateEmployeeMonthlyPayslip(
  employee: Employee,
  month: number,
  year: number,
  totalWorkingDays: number = 22,
  daysPresent: number = 22,
  unpaidLeaveDays: number = 0
): Payslip {
  const breakdown = calculateSalaryBreakdown(employee.salary.base, {
    basicPct: employee.salary.basicPct,
    hraPct: employee.salary.hraPct,
    stdPct: employee.salary.stdPct,
    pfPct: employee.salary.pfPct,
    ptFixed: employee.salary.ptFixed,
  });

  const periodDate = new Date(year, month - 1, 1);
  const periodLabel = format(periodDate, "MMMM yyyy");

  // Daily rate for unpaid leaves deduction
  const dailyRate = totalWorkingDays > 0 ? breakdown.earnings.totalEarnings / totalWorkingDays : 0;
  const unpaidLeaveDeduction = unpaidLeaveDays * dailyRate;

  const totalDeductions = breakdown.deductions.totalDeductions + unpaidLeaveDeduction;
  const netPayable = Math.max(0, breakdown.earnings.totalEarnings - totalDeductions);

  return {
    id: `ps_${employee.id}_${year}_${String(month).padStart(2, "0")}`,
    employeeId: employee.id,
    employeeName: employee.name,
    employeeCode: employee.id,
    department: employee.department,
    designation: employee.role,
    bankName: employee.bankName,
    accountNo: employee.accountNo,
    panTaxId: employee.panTaxId,
    period: periodLabel,
    periodMonth: month,
    periodYear: year,
    totalWorkingDays,
    daysPresent,
    paidLeaveDays: 0,
    unpaidLeaveDays,
    basicSalary: breakdown.earnings.basic,
    hra: breakdown.earnings.hra,
    standardAllowance: breakdown.earnings.standardAllowance,
    specialAllowance: breakdown.earnings.specialAllowance,
    grossEarnings: breakdown.earnings.totalEarnings,
    pfDeduction: breakdown.deductions.providentFund,
    ptDeduction: breakdown.deductions.professionalTax,
    tdsDeduction: breakdown.deductions.taxDeductedAtSource,
    unpaidLeaveDeduction,
    totalDeductions,
    netPayable,
    status: "Generated",
    generatedAt: new Date().toISOString(),
  };
}
