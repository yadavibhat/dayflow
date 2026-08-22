import { z } from "zod";

/**
 * Zod schema for PayrollRecord.
 */
export const PayrollRecordSchema = z.object({
  id: z.string().min(1),
  employee_id: z.string().min(1),
  pay_period: z.string().min(1),
  basic: z.number().nonnegative(),
  allowances: z.number().nonnegative(),
  deductions: z.number().nonnegative(),
  net_pay: z.number().nonnegative(),
  status: z.enum(["Draft", "Generated", "Paid", "Cancelled"]),
  updated_at: z.string().min(1),
});

export type PayrollRecordInput = z.infer<typeof PayrollRecordSchema>;

/**
 * Zod schema for SalaryComponents.
 */
export const SalaryComponentsSchema = z
  .object({
    wage: z.number().refine((w) => w > 0, {
      message: "Wage must be greater than 0",
    }),
    workingDaysPerWeek: z.number().min(1).max(7),
    breakTimeMinutes: z.number().nonnegative(),
    basicPct: z.number().min(0).max(100),
    hraPct: z.number().min(0).max(100),
    standardAllowancePct: z.number().min(0).max(100),
    performanceBonusPct: z.number().min(0).max(100),
    ltaPct: z.number().min(0).max(100),
    fixedAllowancePct: z.number().min(0).max(100),
    employeePfPct: z.number().min(0).max(100),
    employerPfPct: z.number().min(0).max(100),
    professionalTax: z.number().nonnegative(),
  })
  .refine(
    (data) => {
      const basic = data.wage * (data.basicPct / 100);
      const hra = basic * (data.hraPct / 100);
      const std = data.wage * (data.standardAllowancePct / 100);
      const perf = data.wage * (data.performanceBonusPct / 100);
      const lta = data.wage * (data.ltaPct / 100);
      const fixed = data.wage * (data.fixedAllowancePct / 100);
      const sum = basic + hra + std + perf + lta + fixed;
      return sum <= data.wage;
    },
    {
      message: "The sum of Basic, HRA, Standard Allowance, Performance Bonus, LTA, and Fixed Allowance must not exceed Wage",
      path: ["wage"],
    }
  );

export type SalaryComponentsInput = z.infer<typeof SalaryComponentsSchema>;

/**
 * Zod schema for AuditLogEntry.
 */
export const AuditLogEntrySchema = z.object({
  id: z.string().min(1),
  actor_id: z.string().min(1),
  entity_type: z.string().min(1),
  entity_id: z.string().min(1),
  action: z.string().min(1),
  before_json: z.any().nullable(),
  after_json: z.any().nullable(),
  created_at: z.string().min(1),
});

export type AuditLogEntryInput = z.infer<typeof AuditLogEntrySchema>;
