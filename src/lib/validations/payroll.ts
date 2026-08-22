import { z } from "zod";

/**
 * ============================================================================
 * Dayflow HRMS — Payroll Domain Validation Schemas
 * ============================================================================
 */

export const SalaryStructureConfigSchema = z
  .object({
    base: z.number().min(0, "Base salary must be non-negative"),
    basicPct: z.number().min(0).max(100, "Basic percentage must be between 0% and 100%").default(50),
    hraPct: z.number().min(0).max(100, "HRA percentage must be between 0% and 100%").default(25),
    stdPct: z.number().min(0).max(100, "Standard allowance must be between 0% and 100%").default(15),
    specialPct: z.number().min(0).max(100, "Special allowance must be between 0% and 100%").default(10),
    pfPct: z.number().min(0).max(100, "PF rate must be between 0% and 100%").default(12),
    ptFixed: z.number().min(0, "Professional Tax must be non-negative").default(200),
    tdsMonthly: z.number().min(0, "TDS must be non-negative").default(0),
  })
  .refine(
    (data) => {
      const sum = data.basicPct + data.hraPct + data.stdPct + data.specialPct;
      return Math.abs(sum - 100) < 0.01;
    },
    {
      message: "Total salary allocations (Basic + HRA + Standard + Special) must equal exactly 100%",
      path: ["specialPct"],
    }
  );

export type SalaryStructureConfig = z.infer<typeof SalaryStructureConfigSchema>;

export const GeneratePayslipInputSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  month: z.number().int().min(1).max(12, "Month must be between 1 and 12"),
  year: z.number().int().min(2020).max(2050, "Year must be valid"),
  unpaidDays: z.number().min(0).default(0),
  bonus: z.number().min(0).default(0),
});

export type GeneratePayslipInput = z.infer<typeof GeneratePayslipInputSchema>;

export const ProcessPayrollBatchSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2050),
  disbursedBy: z.string().min(1, "Approver ID is required"),
});

export type ProcessPayrollBatchInput = z.infer<typeof ProcessPayrollBatchSchema>;
