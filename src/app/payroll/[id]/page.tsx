"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp, SalaryProfile } from "@/context/AppContext";

export default function PayrollManagementPage() {
  const router = useRouter();
  const { id } = useParams();
  const { employees, updateSalaryProfile } = useApp();

  const employee = employees.find((e) => e.id === id);

  // States
  const [base, setBase] = useState("");
  const [basicPct, setBasicPct] = useState("50");
  const [hraPct, setHraPct] = useState("25");
  const [stdPct, setStdPct] = useState("15"); // Changed from 10 to 15 to make it sum to 100% with Basic (50) and HRA (25) and Special (10)
  const [specialPct, setSpecialPct] = useState("10");

  const [calculationState, setCalculationState] = useState<"awaiting" | "calculated">("awaiting");
  const [isSaved, setIsSaved] = useState(false);

  // Computed amounts
  const [basicAmt, setBasicAmt] = useState(0);
  const [hraAmt, setHraAmt] = useState(0);
  const [stdAmt, setStdAmt] = useState(0);
  const [specialAmt, setSpecialAmt] = useState(0);
  const [pfAmt, setPfAmt] = useState(0);
  const [ptAmt, setPtAmt] = useState(200);

  useEffect(() => {
    if (employee) {
      setBase(String(employee.salary.base));
      setBasicPct(String(employee.salary.basicPct));
      setHraPct(String(employee.salary.hraPct));
      setStdPct(String(employee.salary.stdPct));
      
      const basicAllocation = employee.salary.base * (employee.salary.basicPct / 100);
      const hraAllocation = employee.salary.base * (employee.salary.hraPct / 100);
      const stdAllocation = employee.salary.base * (employee.salary.stdPct / 100);
      const remainingPct = 100 - (employee.salary.basicPct + employee.salary.hraPct + employee.salary.stdPct);
      const specAllocation = employee.salary.base * (remainingPct / 100);

      setSpecialPct(String(remainingPct));
      setBasicAmt(basicAllocation);
      setHraAmt(hraAllocation);
      setStdAmt(stdAllocation);
      setSpecialAmt(specAllocation);
      
      // PF is 12% of Basic
      setPfAmt(basicAllocation * 0.12);
      setPtAmt(employee.salary.ptFixed);
      
      setCalculationState("calculated");
    }
  }, [employee]);

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="p-gutter-desktop max-w-5xl mx-auto text-center py-20">
          <h2 className="font-headline-lg text-primary font-bold">Employee Not Found</h2>
          <p className="text-secondary mt-2">The requested employee record does not exist.</p>
          <Link href="/employees" className="mt-4 inline-block bg-ink text-on-primary px-4 py-2 rounded">
            Back to Directory
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const handleCalculate = () => {
    const baseVal = parseFloat(base) || 0;
    const bPct = parseFloat(basicPct) || 0;
    const hPct = parseFloat(hraPct) || 0;
    const sPct = parseFloat(stdPct) || 0;
    const specPct = parseFloat(specialPct) || 0;

    const totalPct = bPct + hPct + sPct + specPct;
    if (totalPct !== 100) {
      alert(`Warning: Total allocations equal ${totalPct}%. They must sum to exactly 100% to allocate the full base salary.`);
    }

    const bAmt = baseVal * (bPct / 100);
    const hAmt = baseVal * (hPct / 100);
    const sdAmt = baseVal * (sPct / 100);
    const spAmt = baseVal * (specPct / 100);

    setBasicAmt(bAmt);
    setHraAmt(hAmt);
    setStdAmt(sdAmt);
    setSpecialAmt(spAmt);
    setPfAmt(bAmt * 0.12);

    setCalculationState("calculated");
  };

  const handleSave = () => {
    const baseVal = parseFloat(base) || 0;
    const bPct = parseFloat(basicPct) || 0;
    const hPct = parseFloat(hraPct) || 0;
    const sPct = parseFloat(stdPct) || 0;

    const totalPct = bPct + hPct + sPct + (parseFloat(specialPct) || 0);
    if (totalPct !== 100) {
      alert(`Error: Allocation percentages sum to ${totalPct}%. They must total 100% before saving.`);
      return;
    }

    updateSalaryProfile(employee.id, {
      base: baseVal,
      basicPct: bPct,
      hraPct: hPct,
      stdPct: sPct,
      pfPct: 12,
      ptFixed: ptAmt,
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      router.push("/employees");
    }, 1000);
  };

  const handleDiscard = () => {
    if (confirm("Are you sure you want to discard your changes?")) {
      router.push("/employees");
    }
  };

  const allocatedPercentage =
    (parseFloat(basicPct) || 0) +
    (parseFloat(hraPct) || 0) +
    (parseFloat(stdPct) || 0) +
    (parseFloat(specialPct) || 0);

  return (
    <DashboardLayout>
      <main className="flex-1 p-gutter-mobile lg:p-gutter-desktop max-w-container-max mx-auto w-full">
        <div className="max-w-5xl mx-auto space-y-space-xl">
          {/* Context Header */}
          <div>
            <Link
              className="inline-flex items-center text-secondary hover:text-primary font-label-sm text-label-sm uppercase tracking-wider mb-space-sm font-bold"
              href="/employees"
            >
              <span className="material-symbols-outlined text-[16px] mr-1">arrow_back</span>
              Back to Employee Directory
            </Link>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary flex items-center gap-3 font-bold">
              {employee.name}
              <span className="bg-success-soft text-success-text px-2 py-1 rounded-DEFAULT font-label-sm text-label-sm uppercase tracking-widest border border-success-text/10 inline-block align-middle ml-2 font-bold">
                {employee.status}
              </span>
            </h2>
            <p className="font-body-md text-body-md text-secondary mt-1">
              {employee.role} • {employee.department} Department • HQ Office
            </p>
          </div>

          {/* Bento Grid Layout for Salary Editing */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
            {/* Left Column: Core Wage Input & Summary */}
            <div className="lg:col-span-4 space-y-space-lg">
              {/* Fixed Wage Editor Card */}
              <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-md shadow-sm">
                <div className="flex items-center justify-between mb-space-md">
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">
                    Annual Base Wage
                  </h3>
                  <span className="material-symbols-outlined text-secondary">payments</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block font-label-sm text-label-sm text-secondary uppercase mb-2 font-bold">
                      Total Fixed Wage (INR ₹ / year)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-bold">₹</span>
                      <input
                        className="w-full pl-8 pr-4 py-3 bg-surface-container-lowest border border-border-light rounded-lg font-body-lg text-body-lg text-primary focus:border-ink transition-colors font-medium"
                        placeholder="1200000"
                        type="text"
                        value={base}
                        onChange={(e) => {
                          setBase(e.target.value);
                          setCalculationState("awaiting");
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleCalculate}
                    className="w-full bg-ink text-on-primary font-label-md text-label-md py-3 rounded-lg hover:bg-primary transition-colors active:scale-98 cursor-pointer font-medium"
                  >
                    Calculate Allowances
                  </button>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-md shadow-sm">
                <h3 className="font-headline-md text-headline-md text-primary mb-space-sm font-bold">
                  Computation Status
                </h3>
                {calculationState === "awaiting" ? (
                  <div className="border border-dashed border-outline-variant rounded-lg p-space-md flex flex-col items-center justify-center text-center py-8 bg-slate-surface/30">
                    <span className="material-symbols-outlined text-secondary text-4xl mb-3 opacity-50">
                      calculate
                    </span>
                    <p className="font-label-md text-label-md text-primary mb-1 font-bold">
                      Awaiting Calculation
                    </p>
                    <p className="font-body-md text-body-md text-secondary leading-snug">
                      Update the Annual Base Wage in ₹ and click calculate to distribute allowances.
                    </p>
                  </div>
                ) : (
                  <div className="border border-solid border-success-text/20 bg-success-soft/30 rounded-lg p-space-md flex flex-col items-center justify-center text-center py-8">
                    <span className="material-symbols-outlined text-success-text text-4xl mb-3">
                      check_circle
                    </span>
                    <p className="font-label-md text-label-md text-success-text mb-1 font-bold">
                      Salary Computed (₹)
                    </p>
                    <p className="font-body-md text-body-md text-secondary leading-snug">
                      Annual: ₹{(parseFloat(base) || 0).toLocaleString("en-IN")} • Monthly: ₹{((parseFloat(base) || 0) / 12).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Salary Components Configuration */}
            <div className="lg:col-span-8 space-y-space-lg">
              <div className="bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden shadow-sm">
                <div className="px-space-md py-space-sm border-b border-border-light bg-slate-surface flex justify-between items-center">
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">
                    Salary Components Distribution (INR ₹)
                  </h3>
                  <span
                    className={`font-label-sm text-label-sm px-2 py-1 rounded font-bold ${
                      allocatedPercentage === 100
                        ? "bg-success-soft text-success-text"
                        : "bg-warning-soft text-warning-text"
                    }`}
                  >
                    {allocatedPercentage}% Allocated
                  </span>
                </div>

                {/* Component Table List */}
                <div className="divide-y divide-surface-container-low">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 px-space-md py-3 bg-slate-surface/50 font-bold">
                    <div className="col-span-6 font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                      Component
                    </div>
                    <div className="col-span-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider text-right">
                      % of Base
                    </div>
                    <div className="col-span-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider text-right">
                      Computed Amt
                    </div>
                  </div>

                  {/* Basic */}
                  <div className="grid grid-cols-12 gap-4 px-space-md py-4 items-center hover:bg-slate-surface transition-colors">
                    <div className="col-span-6">
                      <p className="font-label-md text-label-md text-primary font-bold">Basic Salary</p>
                      <p className="font-body-md text-body-md text-secondary text-[12px] mt-0.5">
                        Core fixed pay component
                      </p>
                    </div>
                    <div className="col-span-3 text-right">
                      <div className="inline-flex items-center border border-border-light rounded bg-surface-container-lowest overflow-hidden">
                        <input
                          className="w-12 text-center py-1 border-none bg-transparent font-body-md text-body-md text-primary p-0 focus:ring-0 focus:border-none focus:outline-none"
                          type="number"
                          value={basicPct}
                          onChange={(e) => {
                            setBasicPct(e.target.value);
                            setCalculationState("awaiting");
                          }}
                        />
                        <span className="text-secondary pr-2 font-body-md text-body-md font-bold">%</span>
                      </div>
                    </div>
                    <div className="col-span-3 text-right font-body-md text-body-md text-primary font-medium">
                      ₹{basicAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* HRA */}
                  <div className="grid grid-cols-12 gap-4 px-space-md py-4 items-center hover:bg-slate-surface transition-colors">
                    <div className="col-span-6">
                      <p className="font-label-md text-label-md text-primary font-bold">
                        House Rent Allowance
                      </p>
                      <p className="font-body-md text-body-md text-secondary text-[12px] mt-0.5">
                        Accommodation benefit
                      </p>
                    </div>
                    <div className="col-span-3 text-right">
                      <div className="inline-flex items-center border border-border-light rounded bg-surface-container-lowest overflow-hidden">
                        <input
                          className="w-12 text-center py-1 border-none bg-transparent font-body-md text-body-md text-primary p-0 focus:ring-0"
                          type="number"
                          value={hraPct}
                          onChange={(e) => {
                            setHraPct(e.target.value);
                            setCalculationState("awaiting");
                          }}
                        />
                        <span className="text-secondary pr-2 font-body-md text-body-md font-bold">%</span>
                      </div>
                    </div>
                    <div className="col-span-3 text-right font-body-md text-body-md text-primary font-medium">
                      ₹{hraAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Standard Allowance */}
                  <div className="grid grid-cols-12 gap-4 px-space-md py-4 items-center hover:bg-slate-surface transition-colors">
                    <div className="col-span-6">
                      <p className="font-label-md text-label-md text-primary font-bold">Standard Allowance</p>
                      <p className="font-body-md text-body-md text-secondary text-[12px] mt-0.5">
                        Fixed operational allowance
                      </p>
                    </div>
                    <div className="col-span-3 text-right">
                      <div className="inline-flex items-center border border-border-light rounded bg-surface-container-lowest overflow-hidden">
                        <input
                          className="w-12 text-center py-1 border-none bg-transparent font-body-md text-body-md text-primary p-0 focus:ring-0"
                          type="number"
                          value={stdPct}
                          onChange={(e) => {
                            setStdPct(e.target.value);
                            setCalculationState("awaiting");
                          }}
                        />
                        <span className="text-secondary pr-2 font-body-md text-body-md font-bold">%</span>
                      </div>
                    </div>
                    <div className="col-span-3 text-right font-body-md text-body-md text-primary font-medium">
                      ₹{stdAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Special Allowance */}
                  <div className="grid grid-cols-12 gap-4 px-space-md py-4 items-center hover:bg-slate-surface transition-colors">
                    <div className="col-span-6">
                      <p className="font-label-md text-label-md text-primary font-bold">Special Allowance</p>
                      <p className="font-body-md text-body-md text-secondary text-[12px] mt-0.5">
                        Variable benefit modifier
                      </p>
                    </div>
                    <div className="col-span-3 text-right">
                      <div className="inline-flex items-center border border-border-light rounded bg-surface-container-lowest overflow-hidden">
                        <input
                          className="w-12 text-center py-1 border-none bg-transparent font-body-md text-body-md text-primary p-0 focus:ring-0"
                          type="number"
                          value={specialPct}
                          onChange={(e) => {
                            setSpecialPct(e.target.value);
                            setCalculationState("awaiting");
                          }}
                        />
                        <span className="text-secondary pr-2 font-body-md text-body-md font-bold">%</span>
                      </div>
                    </div>
                    <div className="col-span-3 text-right font-body-md text-body-md text-primary font-medium">
                      ₹{specialAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Deductions Block */}
              <div className="bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden shadow-sm">
                <div className="px-space-md py-space-sm border-b border-border-light bg-slate-surface">
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">
                    Deductions &amp; Statutory Compliance (INR ₹)
                  </h3>
                </div>
                <div className="p-space-md grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div className="border border-border-light rounded-lg p-space-sm flex justify-between items-start">
                    <div>
                      <p className="font-label-md text-label-md text-primary font-bold">Provident Fund (PF)</p>
                      <p className="font-label-sm text-[10px] text-secondary uppercase mt-1 font-bold">
                        12% of Basic Salary
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-body-md text-body-md text-primary font-medium">
                        ₹{pfAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className="border border-border-light rounded-lg p-space-sm flex justify-between items-start">
                    <div>
                      <p className="font-label-md text-label-md text-primary font-bold">Professional Tax (PT)</p>
                      <p className="font-label-sm text-[10px] text-secondary uppercase mt-1 font-bold">
                        Fixed Deductible
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-body-md text-body-md text-primary font-medium">
                        ₹{ptAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Action Controls */}
              <div className="flex justify-end gap-3 mt-space-lg">
                <button
                  onClick={handleDiscard}
                  className="bg-surface-container-lowest border border-border-light text-secondary font-label-md text-label-md px-6 py-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer font-medium"
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleSave}
                  className="bg-ink text-on-primary font-label-md text-label-md px-6 py-2 rounded-lg hover:bg-primary transition-colors cursor-pointer font-bold active:scale-98"
                >
                  {isSaved ? "Salary Profile Saved!" : "Save Salary Profile"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
