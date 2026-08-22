"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Employee } from "@/lib/types/employee";
import { createEmployee } from "@/lib/services/employees";
import { EmployeeCreateSchema } from "@/lib/validations/employee";

interface EmployeeDirectoryClientProps {
  employees: Employee[];
}

export function EmployeeDirectoryClient({ employees }: EmployeeDirectoryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    department: "Engineering" as const,
    role: "",
    doj: new Date().toISOString().split("T")[0],
    managerId: "",
    address: "",
    email: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{
    loginId: string;
    password: string;
    employeeCode: string;
  } | null>(null);

  // Sync modal state with URL ?add=true query param
  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setModalOpen(true);
    } else {
      setModalOpen(false);
    }
  }, [searchParams]);

  const handleCloseModal = () => {
    setModalOpen(false);
    setFormData({
      name: "",
      phone: "",
      department: "Engineering",
      role: "",
      doj: new Date().toISOString().split("T")[0],
      managerId: "",
      address: "",
      email: "",
    });
    setFormErrors({});
    setErrorMsg(null);
    setCredentials(null);
    router.replace("/employees");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setErrorMsg(null);

    // 1. Validate form fields client-side using Zod
    const validated = EmployeeCreateSchema.safeParse(formData);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach((issue) => {
        errors[issue.path.join(".")] = issue.message;
      });
      setFormErrors(errors);
      setErrorMsg("Please resolve the validation errors on the form.");
      return;
    }

    setIsSubmitting(true);
    // 2. Call server action to generate codes, auth stub, and insert row
    const result = await createEmployee(formData);
    setIsSubmitting(false);

    if (result.success && result.credentials) {
      setCredentials(result.credentials);
      router.refresh(); // revalidate page data to show new list
    } else {
      setErrorMsg(result.error || "An unexpected error occurred while adding the employee.");
    }
  };

  // Client-side filter over the server-fetched list
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  return (
    <>
      {/* Header + Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
        <div>
          <h1 className="font-headline-lg text-headline-lg gradient-heading font-bold">
            Employee Directory
          </h1>
          <p className="font-body-md text-secondary mt-2">
            {employees.length} team member{employees.length !== 1 ? "s" : ""} on record.
          </p>
        </div>
        <div className="flex items-center gap-space-sm w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">
              search
            </span>
            <input
              className="w-full bg-surface-container-lowest border border-border-light rounded-lg pl-9 pr-3 py-2.5 font-body-md text-ink focus:outline-none focus:border-ink transition-colors"
              placeholder="Search by name, dept, or role..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Link
            href="/employees?add=true"
            className="bg-ink text-on-primary font-label-md text-label-md px-4 py-2.5 rounded-lg hover:bg-primary transition-colors font-bold flex items-center gap-1.5 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span className="hidden sm:inline">Add Employee</span>
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {employees.length === 0 && (
        <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-xl text-center py-20 shadow-sm">
          <span className="material-symbols-outlined text-secondary text-5xl mb-4 opacity-40">
            group_off
          </span>
          <h2 className="font-headline-md text-primary font-bold mb-2">
            No employees yet
          </h2>
          <p className="text-secondary font-body-md max-w-md mx-auto mb-6">
            The employee directory is empty. Start by adding your first team member to populate
            the org chart and enable attendance, payroll, and leave management.
          </p>
          <Link
            href="/employees?add=true"
            className="bg-ink text-on-primary font-label-md text-label-md px-6 py-2.5 rounded-lg hover:bg-primary transition-colors font-bold inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add First Employee
          </Link>
        </div>
      )}

      {/* No search results */}
      {employees.length > 0 && filtered.length === 0 && (
        <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-lg text-center py-16 shadow-sm">
          <span className="material-symbols-outlined text-secondary text-4xl mb-3 opacity-40">
            search_off
          </span>
          <h3 className="font-headline-md text-primary font-bold mb-1">No matches</h3>
          <p className="text-secondary font-body-md">
            No employees match &quot;{searchQuery}&quot;. Try a different search term.
          </p>
        </div>
      )}

      {/* Desktop Table */}
      {filtered.length > 0 && (
        <div className="hidden lg:block bg-surface-container-lowest border border-border-light rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light bg-surface-container-low/50">
                <th className="text-left font-label-sm text-label-sm text-secondary font-bold px-space-lg py-3 uppercase tracking-wider">
                  Employee
                </th>
                <th className="text-left font-label-sm text-label-sm text-secondary font-bold px-space-lg py-3 uppercase tracking-wider">
                  Department
                </th>
                <th className="text-left font-label-sm text-label-sm text-secondary font-bold px-space-lg py-3 uppercase tracking-wider">
                  Designation
                </th>
                <th className="text-left font-label-sm text-label-sm text-secondary font-bold px-space-lg py-3 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left font-label-sm text-label-sm text-secondary font-bold px-space-lg py-3 uppercase tracking-wider">
                  Code
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b border-border-light/50 last:border-0 hover:bg-surface-container-low/30 transition-colors"
                >
                  <td className="px-space-lg py-space-md">
                    <Link
                      href={`/employees/${emp.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high border border-border-light shrink-0">
                        {emp.avatar ? (
                          <img
                            alt={emp.name}
                            className="w-full h-full object-cover"
                            src={emp.avatar}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-secondary font-bold text-sm">
                            {emp.name.split(" ").map((n: string) => n[0]).join("")}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-body-md text-ink font-semibold group-hover:text-primary transition-colors">
                          {emp.name}
                        </p>
                        <p className="font-body-sm text-secondary text-xs">
                          {emp.email || "No email"}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-space-lg py-space-md">
                    <span className="text-[11px] text-secondary font-label-sm uppercase tracking-wider bg-surface-container-low px-2 py-0.5 rounded">
                      {emp.department}
                    </span>
                  </td>
                  <td className="px-space-lg py-space-md font-body-md text-secondary">
                    {emp.role}
                  </td>
                  <td className="px-space-lg py-space-md">
                    {emp.todayStatus ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded font-label-sm text-label-sm font-bold border ${
                          emp.todayStatus === "Present"
                            ? "bg-success-soft text-success-text border-success-text/10"
                            : "bg-warning-soft text-warning-text border-warning-text/10"
                        }`}
                      >
                        {emp.todayStatus}
                      </span>
                    ) : (
                      <span className="text-secondary/50 font-body-sm">—</span>
                    )}
                  </td>
                  <td className="px-space-lg py-space-md font-body-sm text-secondary font-mono">
                    {emp.employeeCode}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Cards */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md lg:hidden">
          {filtered.map((emp) => (
            <Link
              key={emp.id}
              href={`/employees/${emp.id}`}
              className="glass-card border border-border-light rounded-xl p-space-md flex flex-col items-center text-center hover-lift cursor-pointer group"
            >
              <div className="relative mb-3">
                {emp.avatar ? (
                  <img
                    alt={emp.name}
                    className="w-16 h-16 rounded-full object-cover border border-border-light"
                    src={emp.avatar}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center border border-border-light text-secondary font-bold text-xl">
                    {emp.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                )}
                {emp.todayStatus && (
                  <div
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-surface-container-lowest ${
                      emp.todayStatus === "Present"
                        ? "bg-success-text pulse-active-ring"
                        : "bg-warning-text"
                    }`}
                    title={emp.todayStatus}
                  ></div>
                )}
              </div>
              <h3 className="font-headline-md text-ink font-bold group-hover:text-primary transition-colors text-sm">
                {emp.name}
              </h3>
              <p className="font-body-sm text-secondary text-xs mt-0.5">{emp.role}</p>
              <span className="text-[10px] text-secondary font-label-sm uppercase tracking-wider mt-1.5 bg-surface-container-low px-2 py-0.5 rounded">
                {emp.department}
              </span>
              <div className="mt-3 pt-3 border-t border-border-light w-full flex items-center justify-center gap-2">
                {emp.todayStatus && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded font-label-sm text-[10px] font-bold border ${
                      emp.todayStatus === "Present"
                        ? "bg-success-soft text-success-text border-success-text/10"
                        : "bg-warning-soft text-warning-text border-warning-text/10"
                    }`}
                  >
                    {emp.todayStatus}
                  </span>
                )}
                <span className="text-[10px] text-secondary font-mono">{emp.employeeCode}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
      {/* Onboarding Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity"
            onClick={() => {
              if (!credentials && !isSubmitting) handleCloseModal();
            }}
          />

          {/* Dialog Container */}
          <div className="bg-surface-container-lowest border border-border-light rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden z-55 animate-fade-in relative flex flex-col max-h-[90vh]">
            
            {credentials ? (
              /* Confirmation Panel for Credentials (shows once) */
              <>
                <div className="p-space-lg border-b border-border-light flex items-center justify-between bg-success-soft/20">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-success-text text-2xl">
                      check_circle
                    </span>
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">
                      Employee Onboarded!
                    </h2>
                  </div>
                </div>

                <div className="p-space-lg space-y-space-lg overflow-y-auto flex-1">
                  <div className="bg-success-soft border border-success-text/10 p-space-md rounded-xl">
                    <p className="font-body-md text-success-text font-medium leading-relaxed">
                      Employee record created successfully! Below are the generated system credentials. Please record these details securely now, as they will not be displayed again.
                    </p>
                  </div>

                  <div className="space-y-space-md bg-surface-container-low p-space-lg rounded-xl border border-border-light">
                    <div>
                      <span className="font-label-sm text-label-sm text-secondary block font-bold uppercase tracking-wider mb-1">
                        Employee Code
                      </span>
                      <p className="font-mono text-lg font-bold text-ink bg-surface-container-lowest border border-border-light px-3 py-2 rounded">
                        {credentials.employeeCode}
                      </p>
                    </div>

                    <div>
                      <span className="font-label-sm text-label-sm text-secondary block font-bold uppercase tracking-wider mb-1">
                        Login ID
                      </span>
                      <p className="font-mono text-lg font-bold text-ink bg-surface-container-lowest border border-border-light px-3 py-2 rounded">
                        {credentials.loginId}
                      </p>
                    </div>

                    <div>
                      <span className="font-label-sm text-label-sm text-secondary block font-bold uppercase tracking-wider mb-1">
                        Temporary Password
                      </span>
                      <p className="font-mono text-lg font-bold text-success-text bg-surface-container-lowest border border-border-light px-3 py-2 rounded">
                        {credentials.password}
                      </p>
                    </div>
                  </div>

                  <div className="bg-warning-soft border border-warning-text/10 p-space-md rounded-xl flex gap-2">
                    <span className="material-symbols-outlined text-warning-text text-lg shrink-0 mt-0.5">
                      info
                    </span>
                    <p className="font-body-sm text-warning-text font-medium leading-snug">
                      The employee should log in using these credentials and change their password immediately via the Security settings on their profile page.
                    </p>
                  </div>
                </div>

                <div className="p-space-lg bg-surface-container-low border-t border-border-light flex justify-end">
                  <button
                    onClick={handleCloseModal}
                    className="bg-ink text-on-primary font-label-md text-label-md px-6 py-2.5 rounded-lg hover:bg-primary transition-colors cursor-pointer font-bold shadow-sm"
                  >
                    Done &amp; Close
                  </button>
                </div>
              </>
            ) : (
              /* Add Employee Form */
              <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
                <div className="p-space-lg border-b border-border-light flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-2xl">
                      person_add
                    </span>
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">
                      Add New Employee
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="p-1 hover:bg-surface-container-high rounded-full text-secondary transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="p-space-lg space-y-space-md overflow-y-auto flex-1">
                  {errorMsg && (
                    <div className="p-space-md bg-danger-soft border border-danger-text/20 text-danger-text rounded-xl font-body-sm">
                      {errorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                    {/* Full Name */}
                    <div className="sm:col-span-2">
                      <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink ${
                          formErrors.name ? "border-danger-text" : "border-border-light"
                        }`}
                        placeholder="e.g. Jane Doe"
                      />
                      {formErrors.name && <p className="text-danger-text text-xs mt-1">{formErrors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink ${
                          formErrors.email ? "border-danger-text" : "border-border-light"
                        }`}
                        placeholder="jane.doe@company.com"
                      />
                      {formErrors.email && <p className="text-danger-text text-xs mt-1">{formErrors.email}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink ${
                          formErrors.phone ? "border-danger-text" : "border-border-light"
                        }`}
                        placeholder="+91 98765 43210"
                      />
                      {formErrors.phone && <p className="text-danger-text text-xs mt-1">{formErrors.phone}</p>}
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                        Department
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 font-body-md text-ink focus:border-ink"
                      >
                        <option value="Design">Design</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Finance">Finance</option>
                        <option value="HR">HR</option>
                      </select>
                    </div>

                    {/* Designation */}
                    <div>
                      <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                        Designation / Role
                      </label>
                      <input
                        type="text"
                        name="role"
                        required
                        value={formData.role}
                        onChange={handleInputChange}
                        className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink ${
                          formErrors.role ? "border-danger-text" : "border-border-light"
                        }`}
                        placeholder="e.g. UX Designer"
                      />
                      {formErrors.role && <p className="text-danger-text text-xs mt-1">{formErrors.role}</p>}
                    </div>

                    {/* Date of Joining */}
                    <div>
                      <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                        Date of Joining
                      </label>
                      <input
                        type="date"
                        name="doj"
                        required
                        value={formData.doj}
                        onChange={handleInputChange}
                        className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink ${
                          formErrors.doj ? "border-danger-text" : "border-border-light"
                        }`}
                      />
                      {formErrors.doj && <p className="text-danger-text text-xs mt-1">{formErrors.doj}</p>}
                    </div>

                    {/* Manager ID */}
                    <div>
                      <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                        Manager ID (Optional)
                      </label>
                      <input
                        type="text"
                        name="managerId"
                        value={formData.managerId}
                        onChange={handleInputChange}
                        className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 font-body-md text-ink focus:border-ink"
                        placeholder="e.g. MGR-001"
                      />
                    </div>

                    {/* Address */}
                    <div className="sm:col-span-2">
                      <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                        Permanent Address
                      </label>
                      <textarea
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleInputChange}
                        className={`w-full bg-surface-container-lowest border rounded px-3 py-2 font-body-md text-ink focus:border-ink min-h-[70px] ${
                          formErrors.address ? "border-danger-text" : "border-border-light"
                        }`}
                        placeholder="Full residing address..."
                      />
                      {formErrors.address && <p className="text-danger-text text-xs mt-1">{formErrors.address}</p>}
                    </div>
                  </div>
                </div>

                <div className="p-space-lg bg-surface-container-low border-t border-border-light flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="border border-border-light text-secondary font-label-md text-label-md px-5 py-2.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer font-medium"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-ink text-on-primary font-label-md text-label-md px-6 py-2.5 rounded-lg hover:bg-primary transition-colors cursor-pointer font-bold disabled:opacity-50 shadow-sm flex items-center gap-1.5"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Onboarding..." : "Add Employee"}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </>
  );
}
