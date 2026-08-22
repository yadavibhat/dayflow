"use client";

import React, { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Employee } from "@/lib/types/employee";
import { SalaryComponents } from "@/lib/types/payroll_audit";
import { calculateSalary } from "@/lib/payroll/calculations";
import { SalaryComponentsSchema } from "@/lib/validations/payroll_audit";
import { upsertSalaryComponents } from "@/services/payroll";

interface HRPayrollClientProps {
  employees: Employee[];
}

const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export function HRPayrollClient({ employees }: HRPayrollClientProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"Salary Info">("Salary Info");

  // Selected Employee
  const selected = useMemo(() => {
    return employees.find((emp) => emp.id === selectedId) || null;
  }, [employees, selectedId]);

  // Form State for Selected Employee's structure
  const [formData, setFormData] = useState({
    wage: "0",
    workingDaysPerWeek: "5",
    breakTimeMinutes: "60",
    basicPct: "0",
    hraPct: "0",
    standardAllowancePct: "0",
    performanceBonusPct: "0",
    ltaPct: "0",
    fixedAllowancePct: "0",
    employeePfPct: "0",
    employerPfPct: "0",
    professionalTax: "0",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Set form data when selected employee changes
  React.useEffect(() => {
    if (selected) {
      // Map existing salary config if any
      const s = selected.salary as any;
      setFormData({
        wage: String(s?.base || s?.wage || "0"),
        workingDaysPerWeek: String(s?.workingDaysPerWeek || "5"),
        breakTimeMinutes: String(s?.breakTimeMinutes || "60"),
        basicPct: String(s?.basicPct || "0"),
        hraPct: String(s?.hraPct || "0"),
        standardAllowancePct: String(s?.stdPct || s?.standardAllowancePct || "0"), // mapped stdPct -> standardAllowancePct
        performanceBonusPct: String(s?.performanceBonusPct || "0"),
        ltaPct: String(s?.ltaPct || "0"),
        fixedAllowancePct: String(s?.fixedAllowancePct || "0"),
        employeePfPct: String(s?.pfPct || s?.employeePfPct || "0"), // mapped pfPct -> employeePfPct
        employerPfPct: String(s?.employerPfPct || "0"),
        professionalTax: String(s?.ptFixed || s?.professionalTax || "0"), // mapped ptFixed -> professionalTax
      });
      setFormErrors({});
      setServerError(null);
      setSaveSuccess(false);
    }
  }, [selected]);

  // Filter Employees
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q)
    );
  }, [employees, search]);

  // Parse components and compute values live using pure calculateSalary
  const currentComponents = useMemo((): SalaryComponents => {
    return {
      wage: parseFloat(formData.wage) || 0,
      workingDaysPerWeek: parseInt(formData.workingDaysPerWeek) || 5,
      breakTimeMinutes: parseInt(formData.breakTimeMinutes) || 60,
      basicPct: parseFloat(formData.basicPct) || 0,
      hraPct: parseFloat(formData.hraPct) || 0,
      standardAllowancePct: parseFloat(formData.standardAllowancePct) || 0,
      performanceBonusPct: parseFloat(formData.performanceBonusPct) || 0,
      ltaPct: parseFloat(formData.ltaPct) || 0,
      fixedAllowancePct: parseFloat(formData.fixedAllowancePct) || 0,
      employeePfPct: parseFloat(formData.employeePfPct) || 0,
      employerPfPct: parseFloat(formData.employerPfPct) || 0,
      professionalTax: parseFloat(formData.professionalTax) || 0,
    };
  }, [formData]);

  const computed = useMemo(() => {
    return calculateSalary(currentComponents);
  }, [currentComponents]);

  // Client-side validation using Zod on change
  const validationResult = useMemo(() => {
    return SalaryComponentsSchema.safeParse(currentComponents);
  }, [currentComponents]);

  // Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setSaveSuccess(false);
  };

  // Submit trigger
  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFormErrors({});

    // Validate with Zod before showing confirmation
    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        errors[issue.path.join(".")] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    setConfirmOpen(true);
  };

  // Confirm Save Action
  const handleConfirmSave = async () => {
    if (!selected) return;
    setConfirmOpen(false);
    setIsSubmitting(true);
    setServerError(null);

    const result = await upsertSalaryComponents(selected.id, currentComponents);
    setIsSubmitting(false);

    if (result.success) {
      setSaveSuccess(true);
      // Wait a moment then clear selection
      setTimeout(() => {
        setSaveSuccess(false);
        window.location.reload(); // Refresh to reload data securely
      }, 1000);
    } else {
      setServerError(result.error || "Failed to save salary configuration.");
    }
  };

  const isSaveDisabled = !validationResult.success || isSubmitting;

  return (
    <DashboardLayout>
      <main className="flex-1 p-gutter-mobile lg:p-gutter-desktop max-w-container-max mx-auto w-full">
        <div className="max-w-6xl mx-auto space-y-space-xl">
          
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-1 font-bold">
                HR Administration
              </p>
              <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Payroll &amp; Compensation</h1>
              <p className="font-body-md text-body-md text-secondary mt-1">
                Define wage structures, working day rules, and component configurations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-space-lg items-start">
            
            {/* Employee Selector Panel */}
            <div className="lg:col-span-2 bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden shadow-sm">
              <div className="px-space-md py-4 border-b border-border-light bg-surface-container-low/50">
                <h2 className="font-headline-md text-headline-md text-primary font-bold mb-3">Select Employee</h2>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-[18px]">search</span>
                  <input
                    className="w-full pl-9 pr-4 py-2.5 bg-surface-container-lowest border border-border-light rounded-lg font-body-md text-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    placeholder="Search by name or dept…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="p-8 text-center text-secondary">
                    <span className="material-symbols-outlined text-3xl mb-2 block">search_off</span>
                    <p className="font-body-md">No employees found</p>
                  </div>
                ) : (
                  filtered.map((emp) => {
                    const isSelected = emp.id === selectedId;
                    const hasSalary = emp.salary && emp.salary.base > 0;
                    return (
                      <button
                        key={emp.id}
                        onClick={() => setSelectedId(emp.id)}
                        className={`w-full text-left px-space-md py-4 flex items-center gap-3 transition-all border-b border-border-light last:border-0 focus:outline-none ${
                          isSelected ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-surface-container-low"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold shrink-0">
                          {emp.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-label-md text-label-md text-primary font-semibold truncate">{emp.name}</p>
                          <p className="text-secondary text-[12px] truncate">{emp.role} · {emp.department}</p>
                        </div>
                        <div>
                          {hasSalary ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border bg-success-soft text-success-text border-success-text/10">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border bg-warning-soft text-warning-text border-warning-text/10">
                              Not Set
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Editor Panel */}
            <div className="lg:col-span-3">
              {!selected ? (
                <div className="bg-surface-container-lowest border border-dashed border-border-light rounded-xl p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl text-secondary">person_search</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold mb-2">No Employee Selected</h3>
                  <p className="font-body-md text-secondary">
                    Select an employee from the directory list to configuration their salary structure.
                  </p>
                </div>
              ) : (
                <div className="space-y-space-md">
                  
                  {/* Selected Employee Info */}
                  <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-md flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg shrink-0">
                      {selected.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-headline-md text-headline-md text-primary font-bold">{selected.name}</p>
                      <p className="text-secondary text-[13px]">{selected.role} · {selected.department}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTab("Salary Info")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          tab === "Salary Info" ? "bg-ink text-on-primary border-ink" : "bg-transparent text-secondary border-border-light"
                        }`}
                      >
                        Salary Info
                      </button>
                    </div>
                  </div>

                  {/* Salary Editor tab */}
                  {tab === "Salary Info" && (
                    <form onSubmit={handleSaveClick} className="space-y-space-md">
                      
                      {serverError && (
                        <div className="p-4 bg-danger-soft border border-danger-text/10 text-danger-text rounded-xl text-xs font-medium">
                          {serverError}
                        </div>
                      )}

                      {/* Wage Type & Hours */}
                      <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-lg shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Wage Type</label>
                          <select className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 text-xs font-semibold text-primary focus:outline-none">
                            <option>Fixed Salary</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Days / Week</label>
                          <input
                            type="number"
                            name="workingDaysPerWeek"
                            min="1"
                            max="7"
                            className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 text-xs font-semibold text-primary focus:outline-none"
                            value={formData.workingDaysPerWeek}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Break (Mins)</label>
                          <input
                            type="number"
                            name="breakTimeMinutes"
                            min="0"
                            className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 text-xs font-semibold text-primary focus:outline-none"
                            value={formData.breakTimeMinutes}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      {/* Base Wage */}
                      <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-lg shadow-sm">
                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Annual CTC (Wage)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-bold">₹</span>
                          <input
                            type="number"
                            name="wage"
                            min="0"
                            className="w-full pl-7 pr-4 py-2.5 bg-surface-container-lowest border border-border-light rounded-lg font-body-md text-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={formData.wage}
                            onChange={handleInputChange}
                          />
                        </div>
                        {formErrors.wage && <p className="text-red-600 text-xs mt-1 font-medium">{formErrors.wage}</p>}
                      </div>

                      {/* Percentage Allocations */}
                      <div className="bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden shadow-sm">
                        <div className="px-space-md py-4 bg-surface-container-low/50 border-b border-border-light flex justify-between items-center">
                          <h3 className="font-headline-md text-headline-md text-primary font-bold">Components Structure</h3>
                          <span className="text-xs text-secondary font-semibold">Live computed breakdown</span>
                        </div>
                        
                        <div className="divide-y divide-border-light">
                          {/* Basic */}
                          <div className="grid grid-cols-12 gap-4 px-space-md py-4 items-center">
                            <div className="col-span-6">
                              <p className="font-label-md text-primary font-semibold">Basic Salary</p>
                              <p className="text-[10px] text-secondary">Core component (Percentage of Wage)</p>
                            </div>
                            <div className="col-span-3 text-right">
                              <input
                                type="number"
                                name="basicPct"
                                min="0"
                                max="100"
                                className="w-16 border border-border-light rounded text-center py-1 text-xs font-semibold text-primary"
                                value={formData.basicPct}
                                onChange={handleInputChange}
                              />
                              <span className="text-secondary text-xs pl-1 font-bold">%</span>
                            </div>
                            <div className="col-span-3 text-right font-body-md text-primary font-medium">
                              {INR(computed.basic)}
                            </div>
                          </div>

                          {/* HRA */}
                          <div className="grid grid-cols-12 gap-4 px-space-md py-4 items-center">
                            <div className="col-span-6">
                              <p className="font-label-md text-primary font-semibold">House Rent Allowance (HRA)</p>
                              <p className="text-[10px] text-secondary">Housing benefit (Percentage of Basic)</p>
                            </div>
                            <div className="col-span-3 text-right">
                              <input
                                type="number"
                                name="hraPct"
                                min="0"
                                max="100"
                                className="w-16 border border-border-light rounded text-center py-1 text-xs font-semibold text-primary"
                                value={formData.hraPct}
                                onChange={handleInputChange}
                              />
                              <span className="text-secondary text-xs pl-1 font-bold">%</span>
                            </div>
                            <div className="col-span-3 text-right font-body-md text-primary font-medium">
                              {INR(computed.hra)}
                            </div>
                          </div>

                          {/* Standard Allowance */}
                          <div className="grid grid-cols-12 gap-4 px-space-md py-4 items-center">
                            <div className="col-span-6">
                              <p className="font-label-md text-primary font-semibold">Standard Allowance</p>
                              <p className="text-[10px] text-secondary">Statutory standard allowance (Percentage of Wage)</p>
                            </div>
                            <div className="col-span-3 text-right">
                              <input
                                type="number"
                                name="standardAllowancePct"
                                min="0"
                                max="100"
                                className="w-16 border border-border-light rounded text-center py-1 text-xs font-semibold text-primary"
                                value={formData.standardAllowancePct}
                                onChange={handleInputChange}
                              />
                              <span className="text-secondary text-xs pl-1 font-bold">%</span>
                            </div>
                            <div className="col-span-3 text-right font-body-md text-primary font-medium">
                              {INR(computed.standardAllowance)}
                            </div>
                          </div>

                          {/* Performance Bonus */}
                          <div className="grid grid-cols-12 gap-4 px-space-md py-4 items-center">
                            <div className="col-span-6">
                              <p className="font-label-md text-primary font-semibold">Performance Bonus</p>
                              <p className="text-[10px] text-secondary">Variable bonus (Percentage of Wage)</p>
                            </div>
                            <div className="col-span-3 text-right">
                              <input
                                type="number"
                                name="performanceBonusPct"
                                min="0"
                                max="100"
                                className="w-16 border border-border-light rounded text-center py-1 text-xs font-semibold text-primary"
                                value={formData.performanceBonusPct}
                                onChange={handleInputChange}
                              />
                              <span className="text-secondary text-xs pl-1 font-bold">%</span>
                            </div>
                            <div className="col-span-3 text-right font-body-md text-primary font-medium">
                              {INR(computed.performanceBonus)}
                            </div>
                          </div>

                          {/* LTA */}
                          <div className="grid grid-cols-12 gap-4 px-space-md py-4 items-center">
                            <div className="col-span-6">
                              <p className="font-label-md text-primary font-semibold">LTA</p>
                              <p className="text-[10px] text-secondary">Leave travel allowance (Percentage of Wage)</p>
                            </div>
                            <div className="col-span-3 text-right">
                              <input
                                type="number"
                                name="ltaPct"
                                min="0"
                                max="100"
                                className="w-16 border border-border-light rounded text-center py-1 text-xs font-semibold text-primary"
                                value={formData.ltaPct}
                                onChange={handleInputChange}
                              />
                              <span className="text-secondary text-xs pl-1 font-bold">%</span>
                            </div>
                            <div className="col-span-3 text-right font-body-md text-primary font-medium">
                              {INR(computed.lta)}
                            </div>
                          </div>

                          {/* Fixed Allowance */}
                          <div className="grid grid-cols-12 gap-4 px-space-md py-4 items-center">
                            <div className="col-span-6">
                              <p className="font-label-md text-primary font-semibold">Fixed Allowance</p>
                              <p className="text-[10px] text-secondary">Remaining allocation component (Percentage of Wage)</p>
                            </div>
                            <div className="col-span-3 text-right">
                              <input
                                type="number"
                                name="fixedAllowancePct"
                                min="0"
                                max="100"
                                className="w-16 border border-border-light rounded text-center py-1 text-xs font-semibold text-primary"
                                value={formData.fixedAllowancePct}
                                onChange={handleInputChange}
                              />
                              <span className="text-secondary text-xs pl-1 font-bold">%</span>
                            </div>
                            <div className="col-span-3 text-right font-body-md text-primary font-medium">
                              {INR(computed.fixedAllowance)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Provident Fund & Professional Tax */}
                      <div className="bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden shadow-sm p-space-lg grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Employee PF (%)</label>
                          <input
                            type="number"
                            name="employeePfPct"
                            min="0"
                            max="100"
                            className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 text-xs font-semibold text-primary focus:outline-none"
                            value={formData.employeePfPct}
                            onChange={handleInputChange}
                          />
                          <p className="text-[9px] text-secondary mt-1">Computed: {INR(computed.employeePf)}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Employer PF (%)</label>
                          <input
                            type="number"
                            name="employerPfPct"
                            min="0"
                            max="100"
                            className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 text-xs font-semibold text-primary focus:outline-none"
                            value={formData.employerPfPct}
                            onChange={handleInputChange}
                          />
                          <p className="text-[9px] text-secondary mt-1">Computed: {INR(computed.employerPf)}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Prof. Tax (₹)</label>
                          <input
                            type="number"
                            name="professionalTax"
                            min="0"
                            className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 text-xs font-semibold text-primary focus:outline-none"
                            value={formData.professionalTax}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      {/* Totals Preview Panel */}
                      <div className="bg-surface-container-low border border-border-light rounded-xl p-space-lg grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-[10px] text-secondary uppercase font-bold mb-1">Allowances Total</p>
                          <p className="text-sm font-semibold text-primary">{INR(computed.allowancesTotal)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-secondary uppercase font-bold mb-1">Deductions Total</p>
                          <p className="text-sm font-semibold text-red-600">− {INR(computed.deductionsTotal)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-secondary uppercase font-bold mb-1">Net Monthly Pay</p>
                          <p className="text-base font-black text-primary">{INR(computed.netPay)}</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="submit"
                          disabled={isSaveDisabled}
                          className="px-6 py-3 rounded-xl bg-ink text-on-primary font-label-md font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          {isSubmitting ? "Saving..." : saveSuccess ? "Saved!" : "Save Salary Info"}
                        </button>
                      </div>

                    </form>
                  )}

                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Confirmation Dialog Modal */}
      {confirmOpen && selected && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-surface-container-lowest border border-border-light rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <span className="material-symbols-outlined text-4xl text-primary mb-4 block">info</span>
              <h3 className="font-headline-md text-headline-md text-primary font-bold mb-2">Save Salary Configuration?</h3>
              <p className="font-body-md text-body-md text-secondary leading-relaxed">
                You are updating the salary components for <strong>{selected.name}</strong>. Annual CTC will be set to <strong>{INR(currentComponents.wage)}</strong> resulting in a Net Monthly Pay of <strong>{INR(computed.netPay)}</strong>.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-border-light text-secondary font-label-md font-medium hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-5 py-2.5 rounded-xl bg-ink text-on-primary font-label-md font-bold hover:opacity-90 transition-colors"
              >
                Confirm &amp; Write
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
