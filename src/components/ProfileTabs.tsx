"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Employee, calculateSalaryComponents } from "@/lib/types/employee";
import { updateEmployeeProfile } from "@/lib/services/employees";
import { EmployeeSelfEditSchema, EmployeeSchema } from "@/lib/validations/employee";

interface ProfileTabsProps {
  employee: Employee;
  role: "employee" | "hr" | "admin";
  showSalary: boolean;
}

export function ProfileTabs({ employee, role, showSalary }: ProfileTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"resume" | "private" | "salary" | "security">(
    "private"
  );
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: employee.name,
    phone: employee.phone,
    address: employee.address,
    dob: employee.dob,
    nationality: employee.nationality,
    maritalStatus: employee.maritalStatus,
    email: employee.email,
    bankName: employee.bankName,
    accountNo: employee.accountNo,
    routingNo: employee.routingNo,
    panTaxId: employee.panTaxId,
    uan: employee.uan,
    // Job fields for HR edit
    managerId: employee.managerId || "",
    department: employee.department || "Design",
    role: employee.role,
    doj: employee.doj,
  });

  const [salaryData, setSalaryData] = useState({
    base: employee.salary.base,
    basicPct: employee.salary.basicPct,
    hraPct: employee.salary.hraPct,
    stdPct: employee.salary.stdPct,
    pfPct: employee.salary.pfPct,
    ptFixed: employee.salary.ptFixed,
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Security passwords state
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  // Calculate salary components on the fly
  const calculatedSalary = calculateSalaryComponents(salaryData.base, {
    base: salaryData.base,
    basicPct: salaryData.basicPct,
    hraPct: salaryData.hraPct,
    stdPct: salaryData.stdPct,
    pfPct: salaryData.pfPct,
    ptFixed: salaryData.ptFixed,
  });

  const sumOfComponents = 
    calculatedSalary.basic + 
    calculatedSalary.hra + 
    calculatedSalary.stdAllowance + 
    calculatedSalary.fixedAllowance;

  const isSalaryValid = sumOfComponents <= salaryData.base;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
    setSalaryData({
      ...salaryData,
      [e.target.name]: value,
    });
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setErrorMsg(null);
    setSuccessMsg(null);

    // Client-side role-based schema validation
    const schema = role === "employee" ? EmployeeSelfEditSchema : EmployeeSchema;
    const validated = schema.safeParse(formData);

    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join(".")] = issue.message;
      });
      setFormErrors(errors);
      setErrorMsg("Please resolve the validation errors on the form.");
      return;
    }

    setSaving(true);
    const result = await updateEmployeeProfile(employee.id, formData);
    setSaving(false);

    if (result.success) {
      setSuccessMsg("Profile updated successfully!");
      setIsEditing(false);
      router.refresh(); // Triggers server component revalidation
    } else {
      setErrorMsg(result.error || "Failed to update profile");
    }
  };

  const handleSalarySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSalaryValid) {
      setErrorMsg("The sum of components exceeds the base wage.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const result = await updateEmployeeProfile(employee.id, {
      salary: salaryData,
    });
    setSaving(false);

    if (result.success) {
      setSuccessMsg("Salary structure updated successfully!");
      router.refresh();
    } else {
      setErrorMsg(result.error || "Failed to update salary details");
    }
  };

  // Permission checks
  const isEmployee = role === "employee";
  const canEditPersonal = isEditing; // email, phone, address, photo/avatar
  const canEditJob = isEditing && !isEmployee; // designation, department, manager, joining date
  const canEditHRFields = isEditing && !isEmployee; // Name, DOB, Nationality, Marital status, Bank details, PAN, UAN

  return (
    <div className="w-full">
      {/* Messages */}
      {successMsg && (
        <div className="mb-space-md p-space-md bg-success-soft border border-success-text/20 text-success-text rounded-lg font-body-md shadow-sm">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-space-md p-space-md bg-danger-soft border border-danger-text/20 text-danger-text rounded-lg font-body-md shadow-sm">
          {errorMsg}
        </div>
      )}

      {/* Tabs List */}
      <div className="border-b border-border-light mb-space-xl">
        <nav className="flex gap-space-lg">
          <button
            onClick={() => setActiveTab("resume")}
            className={`pb-3 font-label-md text-label-md transition-colors cursor-pointer ${
              activeTab === "resume"
                ? "text-primary border-b-2 border-primary font-bold"
                : "text-secondary hover:text-primary font-medium"
            }`}
          >
            Resume
          </button>
          
          <button
            onClick={() => setActiveTab("private")}
            className={`pb-3 font-label-md text-label-md transition-colors cursor-pointer ${
              activeTab === "private"
                ? "text-primary border-b-2 border-primary font-bold"
                : "text-secondary hover:text-primary font-medium"
            }`}
          >
            Private Info
          </button>

          {/* Salary Info - Gated Server Side & DOM check */}
          {showSalary && (
            <button
              onClick={() => setActiveTab("salary")}
              className={`pb-3 font-label-md text-label-md transition-colors cursor-pointer ${
                activeTab === "salary"
                  ? "text-primary border-b-2 border-primary font-bold"
                  : "text-secondary hover:text-primary font-medium"
              }`}
            >
              Salary Info
            </button>
          )}

          <button
            onClick={() => setActiveTab("security")}
            className={`pb-3 font-label-md text-label-md transition-colors cursor-pointer ${
              activeTab === "security"
                ? "text-primary border-b-2 border-primary font-bold"
                : "text-secondary hover:text-primary font-medium"
            }`}
          >
            Security
          </button>
        </nav>
      </div>

      {/* TAB CONTENT: Resume */}
      {activeTab === "resume" && (
        <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-lg md:p-space-xl text-center py-20 shadow-sm">
          <span className="material-symbols-outlined text-secondary text-5xl mb-4 opacity-60">
            description
          </span>
          <h3 className="font-headline-md text-primary font-bold mb-2">Resume &amp; CV</h3>
          <p className="text-secondary max-w-sm mx-auto mb-6">
            View or replace your employment resume attachments on file.
          </p>
          <button
            onClick={() => alert("Resume download started...")}
            className="bg-ink text-on-primary font-label-md text-label-md px-6 py-2.5 rounded hover:bg-primary transition-colors cursor-pointer font-bold"
          >
            Download CV_Employee.pdf
          </button>
        </div>
      )}

      {/* TAB CONTENT: Private Info */}
      {activeTab === "private" && (
        <form onSubmit={handleProfileSave}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
            {/* Left Column (Personal & Employment) */}
            <div className="lg:col-span-2 flex flex-col gap-space-lg">
              {/* Personal Details */}
              <section className="bg-surface-container-lowest border border-border-light rounded-xl p-space-lg md:p-space-xl shadow-sm">
                <div className="flex items-center justify-between mb-space-lg border-b border-border-light pb-space-sm">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-xl">person</span>
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">
                      Personal Details
                    </h2>
                  </div>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormErrors({});
                        setIsEditing(true);
                      }}
                      className="text-primary hover:text-ink font-label-sm text-label-sm font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Edit Profile
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-space-lg gap-x-space-xl">
                  {/* Name (HR Edit Only) */}
                  <div>
                    <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                      Full Name
                    </label>
                    {canEditHRFields ? (
                      <div>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink ${
                            formErrors.name ? "border-danger-text" : "border-border-light"
                          }`}
                          required
                        />
                        {formErrors.name && <p className="text-danger-text text-xs mt-1">{formErrors.name}</p>}
                      </div>
                    ) : (
                      <p className="font-body-lg text-body-lg text-on-surface font-medium py-1">
                        {employee.name || "Not provided"}
                      </p>
                    )}
                  </div>

                  {/* DOB (HR Edit Only) */}
                  <div>
                    <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                      Date of Birth
                    </label>
                    {canEditHRFields ? (
                      <div>
                        <input
                          type="text"
                          name="dob"
                          placeholder="e.g. October 14, 1990"
                          value={formData.dob || ""}
                          onChange={handleInputChange}
                          className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink ${
                            formErrors.dob ? "border-danger-text" : "border-border-light"
                          }`}
                        />
                        {formErrors.dob && <p className="text-danger-text text-xs mt-1">{formErrors.dob}</p>}
                      </div>
                    ) : (
                      <p className="font-body-lg text-body-lg text-on-surface font-medium py-1">
                        {employee.dob || "Not provided"}
                      </p>
                    )}
                  </div>

                  {/* Nationality (HR Edit Only) */}
                  <div>
                    <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                      Nationality
                    </label>
                    {canEditHRFields ? (
                      <div>
                        <input
                          type="text"
                          name="nationality"
                          value={formData.nationality || ""}
                          onChange={handleInputChange}
                          className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink ${
                            formErrors.nationality ? "border-danger-text" : "border-border-light"
                          }`}
                        />
                        {formErrors.nationality && <p className="text-danger-text text-xs mt-1">{formErrors.nationality}</p>}
                      </div>
                    ) : (
                      <p className="font-body-lg text-body-lg text-on-surface font-medium py-1">
                        {employee.nationality || "Not provided"}
                      </p>
                    )}
                  </div>

                  {/* Marital Status (HR Edit Only) */}
                  <div>
                    <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                      Marital Status
                    </label>
                    {canEditHRFields ? (
                      <div>
                        <input
                          type="text"
                          name="maritalStatus"
                          value={formData.maritalStatus || ""}
                          onChange={handleInputChange}
                          className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink ${
                            formErrors.maritalStatus ? "border-danger-text" : "border-border-light"
                          }`}
                        />
                        {formErrors.maritalStatus && <p className="text-danger-text text-xs mt-1">{formErrors.maritalStatus}</p>}
                      </div>
                    ) : (
                      <p className="font-body-lg text-body-lg text-on-surface font-medium py-1">
                        {employee.maritalStatus || "Not provided"}
                      </p>
                    )}
                  </div>

                  {/* Personal Email (Editable by Anyone) */}
                  <div>
                    <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                      Personal Email
                    </label>
                    {canEditPersonal ? (
                      <div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email || ""}
                          onChange={handleInputChange}
                          className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink ${
                            formErrors.email ? "border-danger-text" : "border-border-light"
                          }`}
                        />
                        {formErrors.email && <p className="text-danger-text text-xs mt-1">{formErrors.email}</p>}
                      </div>
                    ) : (
                      <p className="font-body-lg text-body-lg text-on-surface font-medium py-1">
                        {employee.email || "Not provided"}
                      </p>
                    )}
                  </div>

                  {/* Phone Number (Editable by Anyone) */}
                  <div>
                    <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                      Phone Number
                    </label>
                    {canEditPersonal ? (
                      <div>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone || ""}
                          onChange={handleInputChange}
                          className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink ${
                            formErrors.phone ? "border-danger-text" : "border-border-light"
                          }`}
                        />
                        {formErrors.phone && <p className="text-danger-text text-xs mt-1">{formErrors.phone}</p>}
                      </div>
                    ) : (
                      <p className="font-body-lg text-body-lg text-on-surface font-medium py-1">
                        {employee.phone || "Not provided"}
                      </p>
                    )}
                  </div>

                  {/* Permanent Address (Editable by Anyone) */}
                  <div className="md:col-span-2">
                    <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                      Permanent Address
                    </label>
                    {canEditPersonal ? (
                      <div>
                        <textarea
                          name="address"
                          value={formData.address || ""}
                          onChange={handleInputChange}
                          className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink min-h-[80px] ${
                            formErrors.address ? "border-danger-text" : "border-border-light"
                          }`}
                        />
                        {formErrors.address && <p className="text-danger-text text-xs mt-1">{formErrors.address}</p>}
                      </div>
                    ) : (
                      <p className="font-body-lg text-body-lg text-on-surface leading-relaxed font-medium py-1">
                        {employee.address || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Employment Record */}
              <section className="bg-surface-container-lowest border border-border-light rounded-xl p-space-lg md:p-space-xl shadow-sm">
                <div className="flex items-center gap-2 mb-space-lg border-b border-border-light pb-space-sm">
                  <span className="material-symbols-outlined text-secondary text-xl">work</span>
                  <h2 className="font-headline-md text-headline-md text-primary font-bold">
                    Employment Record
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-space-lg gap-x-space-xl">
                  {/* Date of Joining (HR Edit Only) */}
                  <div>
                    <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                      Date of Joining (DOJ)
                    </label>
                    {canEditJob ? (
                      <div>
                        <input
                          type="text"
                          name="doj"
                          placeholder="e.g. March 01, 2021"
                          value={formData.doj}
                          onChange={handleInputChange}
                          className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink ${
                            formErrors.doj ? "border-danger-text" : "border-border-light"
                          }`}
                        />
                        {formErrors.doj && <p className="text-danger-text text-xs mt-1">{formErrors.doj}</p>}
                      </div>
                    ) : (
                      <p className="font-body-lg text-body-lg text-on-surface font-medium py-1">
                        {employee.doj || "Not provided"}
                      </p>
                    )}
                  </div>

                  {/* Employee Code / Login ID (ALWAYS READ-ONLY FOR EVERYONE) */}
                  <div>
                    <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold text-secondary/60">
                      Employee Code / Login ID (Read-only)
                    </label>
                    <p className="font-body-lg text-body-lg text-secondary/70 font-semibold bg-surface-container-low px-3 py-2 rounded border border-border-light">
                      {employee.employeeCode || "Not provided"}
                    </p>
                  </div>

                  {/* Designation (HR Edit Only) */}
                  <div>
                    <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                      Designation
                    </label>
                    {canEditJob ? (
                      <div>
                        <input
                          type="text"
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink ${
                            formErrors.role ? "border-danger-text" : "border-border-light"
                          }`}
                        />
                        {formErrors.role && <p className="text-danger-text text-xs mt-1">{formErrors.role}</p>}
                      </div>
                    ) : (
                      <p className="font-body-lg text-body-lg text-on-surface font-medium py-1">
                        {employee.role || "Not provided"}
                      </p>
                    )}
                  </div>

                  {/* Department (HR Edit Only) */}
                  <div>
                    <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                      Department
                    </label>
                    {canEditJob ? (
                      <div>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink ${
                            formErrors.department ? "border-danger-text" : "border-border-light"
                          }`}
                        >
                          <option value="Design">Design</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Finance">Finance</option>
                          <option value="HR">HR</option>
                        </select>
                        {formErrors.department && <p className="text-danger-text text-xs mt-1">{formErrors.department}</p>}
                      </div>
                    ) : (
                      <p className="font-body-lg text-body-lg text-on-surface font-medium py-1">
                        {employee.department || "Not provided"}
                      </p>
                    )}
                  </div>

                  {/* Manager ID (HR Edit Only) */}
                  <div>
                    <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                      Manager ID
                    </label>
                    {canEditJob ? (
                      <div>
                        <input
                          type="text"
                          name="managerId"
                          value={formData.managerId}
                          onChange={handleInputChange}
                          className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink ${
                            formErrors.managerId ? "border-danger-text" : "border-border-light"
                          }`}
                        />
                        {formErrors.managerId && <p className="text-danger-text text-xs mt-1">{formErrors.managerId}</p>}
                      </div>
                    ) : (
                      <p className="font-body-lg text-body-lg text-on-surface font-medium py-1">
                        {employee.managerId || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column (Financial & Statutory - HR Edit Only) */}
            <div className="flex flex-col gap-space-lg">
              <section className="bg-surface-container-lowest border border-border-light rounded-xl p-space-lg md:p-space-xl h-full shadow-sm">
                <div className="flex items-center gap-2 mb-space-lg border-b border-border-light pb-space-sm">
                  <span className="material-symbols-outlined text-secondary text-xl">
                    account_balance
                  </span>
                  <h2 className="font-headline-md text-headline-md text-primary font-bold">
                    Financial Data
                  </h2>
                </div>
                <div className="flex flex-col gap-space-lg">
                  {/* Bank Name */}
                  <div>
                    <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                      Bank Name
                    </label>
                    {canEditHRFields ? (
                      <div>
                        <input
                          type="text"
                          name="bankName"
                          value={formData.bankName || ""}
                          onChange={handleInputChange}
                          className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink ${
                            formErrors.bankName ? "border-danger-text" : "border-border-light"
                          }`}
                        />
                        {formErrors.bankName && <p className="text-danger-text text-xs mt-1">{formErrors.bankName}</p>}
                      </div>
                    ) : (
                      <p className="font-body-lg text-body-lg text-on-surface font-medium py-1">
                        {employee.bankName || "Not provided"}
                      </p>
                    )}
                  </div>
                  
                  {/* Account Number */}
                  <div>
                    <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                      Account Number
                    </label>
                    {canEditHRFields ? (
                      <div>
                        <input
                          type="text"
                          name="accountNo"
                          value={formData.accountNo || ""}
                          onChange={handleInputChange}
                          className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink ${
                            formErrors.accountNo ? "border-danger-text" : "border-border-light"
                          }`}
                        />
                        {formErrors.accountNo && <p className="text-danger-text text-xs mt-1">{formErrors.accountNo}</p>}
                      </div>
                    ) : (
                      <p className="font-body-lg text-body-lg text-on-surface font-mono tracking-tight font-medium py-1">
                        {employee.accountNo || "Not provided"}
                      </p>
                    )}
                  </div>

                  {/* Routing / IFSC */}
                  <div>
                    <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                      Routing / IFSC
                    </label>
                    {canEditHRFields ? (
                      <div>
                        <input
                          type="text"
                          name="routingNo"
                          value={formData.routingNo || ""}
                          onChange={handleInputChange}
                          className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink ${
                            formErrors.routingNo ? "border-danger-text" : "border-border-light"
                          }`}
                        />
                        {formErrors.routingNo && <p className="text-danger-text text-xs mt-1">{formErrors.routingNo}</p>}
                      </div>
                    ) : (
                      <p className="font-body-lg text-body-lg text-on-surface font-mono tracking-tight font-medium py-1">
                        {employee.routingNo || "Not provided"}
                      </p>
                    )}
                  </div>

                  <div className="my-space-sm border-t border-border-light border-dashed"></div>

                  {/* PAN / Tax ID */}
                  <div>
                    <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                      PAN / Tax ID
                    </label>
                    {canEditHRFields ? (
                      <div>
                        <input
                          type="text"
                          name="panTaxId"
                          value={formData.panTaxId || ""}
                          onChange={handleInputChange}
                          className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink ${
                            formErrors.panTaxId ? "border-danger-text" : "border-border-light"
                          }`}
                        />
                        {formErrors.panTaxId && <p className="text-danger-text text-xs mt-1">{formErrors.panTaxId}</p>}
                      </div>
                    ) : (
                      <p className="font-body-lg text-body-lg text-on-surface font-mono tracking-tight font-medium py-1">
                        {employee.panTaxId || "Not provided"}
                      </p>
                    )}
                  </div>

                  {/* UAN */}
                  <div>
                    <label className="font-label-sm text-label-sm text-secondary block mb-1 font-bold">
                      UAN
                    </label>
                    {canEditHRFields ? (
                      <div>
                        <input
                          type="text"
                          name="uan"
                          value={formData.uan || ""}
                          onChange={handleInputChange}
                          className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink ${
                            formErrors.uan ? "border-danger-text" : "border-border-light"
                          }`}
                        />
                        {formErrors.uan && <p className="text-danger-text text-xs mt-1">{formErrors.uan}</p>}
                      </div>
                    ) : (
                      <p className="font-body-lg text-body-lg text-on-surface font-mono tracking-tight font-medium py-1">
                        {employee.uan || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-space-xl flex gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-ink text-on-primary font-label-md text-label-md px-6 py-2.5 rounded hover:bg-primary transition-colors cursor-pointer font-bold disabled:opacity-50 flex-1 shadow-sm"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormErrors({});
                        setIsEditing(false);
                        setFormData({
                          name: employee.name,
                          phone: employee.phone,
                          address: employee.address,
                          dob: employee.dob,
                          nationality: employee.nationality,
                          maritalStatus: employee.maritalStatus,
                          email: employee.email,
                          bankName: employee.bankName,
                          accountNo: employee.accountNo,
                          routingNo: employee.routingNo,
                          panTaxId: employee.panTaxId,
                          uan: employee.uan,
                          managerId: employee.managerId || "",
                          department: employee.department || "Design",
                          role: employee.role,
                          doj: employee.doj,
                        });
                      }}
                      className="border border-border-light text-secondary font-label-md text-label-md px-6 py-2.5 rounded hover:bg-surface-container transition-colors cursor-pointer font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="mt-space-xl bg-surface-container-low p-space-md rounded-lg flex gap-3 shadow-inner">
                    <span className="material-symbols-outlined text-secondary text-lg mt-0.5">
                      info
                    </span>
                    <p className="font-body-md text-body-md text-secondary leading-snug">
                      {isEmployee 
                        ? "To update administrative, job, or financial details, please submit a request to HR."
                        : "Salary details can be modified within the Payroll structure module."}
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </form>
      )}

      {/* TAB CONTENT: Salary Info - Only visible to Admin/HR */}
      {showSalary && activeTab === "salary" && (
        <form onSubmit={handleSalarySave} className="max-w-3xl mx-auto">
          <section className="bg-surface-container-lowest border border-border-light rounded-xl p-space-lg md:p-space-xl shadow-sm space-y-space-lg">
            <div className="flex items-center gap-2 mb-space-md border-b border-border-light pb-space-sm">
              <span className="material-symbols-outlined text-secondary text-xl">payments</span>
              <h2 className="font-headline-md text-headline-md text-primary font-bold">
                Salary Structure Configuration
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              <div>
                <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                  Base Wage (Annual/Monthly)
                </label>
                <input
                  type="number"
                  name="base"
                  value={salaryData.base}
                  onChange={handleSalaryChange}
                  className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 font-body-md text-ink focus:border-ink"
                  required
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                  Basic Component Percentage (%)
                </label>
                <input
                  type="number"
                  name="basicPct"
                  value={salaryData.basicPct}
                  onChange={handleSalaryChange}
                  className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 font-body-md text-ink focus:border-ink"
                  max="100"
                  required
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                  HRA Percentage of Basic (%)
                </label>
                <input
                  type="number"
                  name="hraPct"
                  value={salaryData.hraPct}
                  onChange={handleSalaryChange}
                  className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 font-body-md text-ink focus:border-ink"
                  max="100"
                  required
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                  Standard Allowance Percentage (%)
                </label>
                <input
                  type="number"
                  name="stdPct"
                  value={salaryData.stdPct}
                  onChange={handleSalaryChange}
                  className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 font-body-md text-ink focus:border-ink"
                  max="100"
                  required
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                  PF Contribution (%)
                </label>
                <input
                  type="number"
                  name="pfPct"
                  value={salaryData.pfPct}
                  onChange={handleSalaryChange}
                  className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 font-body-md text-ink focus:border-ink"
                  max="100"
                  required
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                  Professional Tax (PT) Deduction
                </label>
                <input
                  type="number"
                  name="ptFixed"
                  value={salaryData.ptFixed}
                  onChange={handleSalaryChange}
                  className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 font-body-md text-ink focus:border-ink"
                  required
                />
              </div>
            </div>

            {/* Calculations Output */}
            <div className="bg-surface-container-low p-space-lg rounded-xl mt-space-lg space-y-3">
              <h3 className="font-label-lg text-label-lg text-primary font-bold mb-2">Calculated Components</h3>
              <div className="grid grid-cols-2 gap-y-2 text-body-md">
                <div className="text-secondary">Basic Salary ({salaryData.basicPct}% of Base):</div>
                <div className="text-right font-mono font-semibold">₹{calculatedSalary.basic.toFixed(2)}</div>
                
                <div className="text-secondary">House Rent Allowance (HRA) ({salaryData.hraPct}% of Basic):</div>
                <div className="text-right font-mono font-semibold">₹{calculatedSalary.hra.toFixed(2)}</div>

                <div className="text-secondary">Standard Allowance ({salaryData.stdPct}% of Base):</div>
                <div className="text-right font-mono font-semibold">₹{calculatedSalary.stdAllowance.toFixed(2)}</div>

                <div className="text-secondary">Fixed/Balancing Allowance:</div>
                <div className="text-right font-mono font-semibold text-primary">₹{calculatedSalary.fixedAllowance.toFixed(2)}</div>

                <div className="border-t border-border-light col-span-2 my-1"></div>

                <div className="text-secondary">Provident Fund (PF):</div>
                <div className="text-right font-mono text-danger-text">-₹{calculatedSalary.pfContribution.toFixed(2)}</div>

                <div className="text-secondary">Professional Tax (PT):</div>
                <div className="text-right font-mono text-danger-text">-₹{calculatedSalary.ptDeduction.toFixed(2)}</div>

                <div className="border-t border-border-light col-span-2 my-1"></div>

                <div className="font-bold text-ink">Net Take Home Pay:</div>
                <div className="text-right font-mono font-bold text-success-text text-lg">₹{calculatedSalary.netPay.toFixed(2)}</div>
              </div>
            </div>

            {/* Validation warning */}
            {!isSalaryValid && (
              <div className="p-space-md bg-danger-soft border border-danger-text/20 text-danger-text rounded-lg font-body-sm animate-pulse">
                Warning: The sum of Basic, HRA, and Standard Allowance exceeds the base Wage. Fixed allowance will be 0.
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving || !isSalaryValid}
                className="bg-ink text-on-primary font-label-md text-label-md px-6 py-2.5 rounded hover:bg-primary transition-colors cursor-pointer font-bold disabled:opacity-50 shadow-sm"
              >
                {saving ? "Saving..." : "Save Salary Config"}
              </button>
            </div>
          </section>
        </form>
      )}

      {/* TAB CONTENT: Security */}
      {activeTab === "security" && (
        <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-lg md:p-space-xl shadow-sm max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-space-lg border-b border-border-light pb-space-sm">
            <span className="material-symbols-outlined text-secondary text-xl">security</span>
            <h2 className="font-headline-md text-headline-md text-primary font-bold">
              Security Settings
            </h2>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert("Password update requested via Supabase Auth!");
            }}
            className="space-y-space-md"
          >
            <div>
              <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                Current Password
              </label>
              <input
                type="password"
                required
                value={securityData.currentPassword}
                onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 font-body-md text-ink focus:border-ink"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                New Password
              </label>
              <input
                type="password"
                required
                value={securityData.newPassword}
                onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 font-body-md text-ink focus:border-ink"
                placeholder="••••••••"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                className="bg-ink text-on-primary font-label-md text-label-md px-6 py-2.5 rounded hover:bg-primary transition-colors font-bold cursor-pointer shadow-sm"
              >
                Change Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
