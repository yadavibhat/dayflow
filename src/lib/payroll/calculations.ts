import { SalaryComponents } from "../types/payroll_audit";

export interface ComputedSalary {
  basic: number;
  hra: number;
  standardAllowance: number;
  performanceBonus: number;
  lta: number;
  fixedAllowance: number;
  employeePf: number;
  employerPf: number;
  professionalTax: number;
  allowancesTotal: number;
  deductionsTotal: number;
  netPay: number;
}

/**
 * Pure calculation function for salary components.
 */
export function calculateSalary(components: SalaryComponents): ComputedSalary {
  const {
    wage,
    basicPct,
    hraPct,
    standardAllowancePct,
    performanceBonusPct,
    ltaPct,
    fixedAllowancePct,
    employeePfPct,
    employerPfPct,
    professionalTax,
  } = components;

  // Basic/StandardAllowance/PerformanceBonus/LTA/FixedAllowance are % of Wage
  const basic = wage * (basicPct / 100);
  const standardAllowance = wage * (standardAllowancePct / 100);
  const performanceBonus = wage * (performanceBonusPct / 100);
  const lta = wage * (ltaPct / 100);
  const fixedAllowance = wage * (fixedAllowancePct / 100);

  // HRA is % of Basic
  const hra = basic * (hraPct / 100);

  // Employee PF and Employer PF are % of Basic
  const employeePf = basic * (employeePfPct / 100);
  const employerPf = basic * (employerPfPct / 100);

  // Allowances total: standardAllowance + performanceBonus + lta + fixedAllowance + hra
  const allowancesTotal = hra + standardAllowance + performanceBonus + lta + fixedAllowance;

  // Deductions total: employee PF + professional tax
  const deductionsTotal = employeePf + professionalTax;

  // Net Pay: basic + allowancesTotal - deductionsTotal
  const netPay = basic + allowancesTotal - deductionsTotal;

  return {
    basic,
    hra,
    standardAllowance,
    performanceBonus,
    lta,
    fixedAllowance,
    employeePf,
    employerPf,
    professionalTax,
    allowancesTotal,
    deductionsTotal,
    netPay,
  };
}
