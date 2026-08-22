import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateSalaryBreakdown,
  generateEmployeeMonthlyPayslip,
} from "../services/payrollService";
import { SalaryStructureConfigSchema } from "../lib/validations/payroll";
import { Employee } from "../lib/validations/schemas";

describe("Payroll Domain & Calculations Suite", () => {
  const dummyEmployee: Employee = {
    id: "1",
    name: "Aarav Sharma",
    role: "Senior Software Engineer",
    department: "Engineering",
    status: "Active",
    avatar: "",
    email: "aarav.sharma@company.in",
    phone: "+91 98765 43210",
    dob: "August 15, 1995",
    nationality: "Indian",
    maritalStatus: "Single",
    address: "Bengaluru",
    doj: "March 01, 2021",
    bankName: "SBI",
    accountNo: "5678",
    routingNo: "SBIN0000123",
    panTaxId: "ABCPS1234Z",
    uan: "100982736451",
    salary: {
      base: 1200000, // 100,000 monthly
      basicPct: 50,
      hraPct: 25,
      stdPct: 15,
      pfPct: 12,
      ptFixed: 200,
    },
  };

  // 1. SALARY BREAKDOWN CALCULATION
  it("should calculate exact monthly earnings and statutory deductions", () => {
    const breakdown = calculateSalaryBreakdown(1200000, {
      basicPct: 50,
      hraPct: 25,
      stdPct: 15,
      specialPct: 10,
      pfPct: 12,
      ptFixed: 200,
    });

    // Monthly base = 100,000
    assert.equal(breakdown.monthlyBase, 100000);
    assert.equal(breakdown.earnings.basic, 50000); // 50%
    assert.equal(breakdown.earnings.hra, 25000); // 25%
    assert.equal(breakdown.earnings.standardAllowance, 15000); // 15%
    assert.equal(breakdown.earnings.specialAllowance, 10000); // 10%
    assert.equal(breakdown.earnings.totalEarnings, 100000);

    // Deductions: PF = 12% of Basic (6,000), PT = 200
    assert.equal(breakdown.deductions.providentFund, 6000);
    assert.equal(breakdown.deductions.professionalTax, 200);
    assert.equal(breakdown.deductions.totalDeductions, 6200);

    // Net pay = 100,000 - 6,200 = 93,800
    assert.equal(breakdown.netMonthlyPay, 93800);
  });

  // 2. 100% ALLOCATION CONSTRAINT VALIDATION
  it("should reject salary allocations that do not equal 100%", () => {
    const invalidConfig = {
      base: 1200000,
      basicPct: 50,
      hraPct: 25,
      stdPct: 10,
      specialPct: 5, // Sum = 90%
      pfPct: 12,
      ptFixed: 200,
      tdsMonthly: 0,
    };

    const result = SalaryStructureConfigSchema.safeParse(invalidConfig);
    assert.equal(result.success, false);
  });

  // 3. MONTHLY PAYSLIP GENERATION WITH UNPAID LEAVE DEDUCTION
  it("should generate a payslip and deduct unpaid leave correctly", () => {
    const payslip = generateEmployeeMonthlyPayslip(
      dummyEmployee,
      8, // August
      2026,
      20, // 20 working days
      18, // 18 days worked
      2 // 2 unpaid leave days
    );

    // Monthly gross = 100,000. Daily rate = 100,000 / 20 = 5,000
    // Unpaid deduction = 2 * 5,000 = 10,000
    assert.equal(payslip.grossEarnings, 100000);
    assert.equal(payslip.unpaidLeaveDeduction, 10000);
    assert.equal(payslip.pfDeduction, 6000);
    assert.equal(payslip.ptDeduction, 200);

    // Total deductions = 6,000 + 200 + 10,000 = 16,200
    assert.equal(payslip.totalDeductions, 16200);
    // Net payable = 100,000 - 16,200 = 83,800
    assert.equal(payslip.netPayable, 83800);
  });
});
