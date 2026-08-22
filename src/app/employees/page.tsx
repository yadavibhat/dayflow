"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";

function EmployeeDirectory() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { employees, addEmployee } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState<"Design" | "Engineering" | "Marketing" | "Finance" | "HR">("Engineering");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [baseSalary, setBaseSalary] = useState("1200000");

  // Open modal if URL query specifies it
  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setModalOpen(true);
    }
  }, [searchParams]);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    // Clear ?add=true from URL
    router.replace("/employees");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !email) return;

    addEmployee({
      name,
      role,
      department,
      status: "Active",
      avatar: "", // default empty fallback avatar icon will render
      email,
      phone,
      dob: "Not specified",
      nationality: "Not specified",
      maritalStatus: "Single",
      address: "Not specified",
      doj: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
      }),
      bankName: "Not specified",
      accountNo: "•••• •••• •••• ••••",
      routingNo: "Not specified",
      panTaxId: "Not specified",
      uan: "Not specified",
      baseSalary: parseFloat(baseSalary) || 50000,
    });

    // Reset Form
    setName("");
    setRole("");
    setDepartment("Engineering");
    setEmail("");
    setPhone("");
    setBaseSalary("70000");
    handleCloseModal();
  };

  // Filter employees based on search query
  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-space-xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
          <div>
            <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg gradient-heading font-bold">
              Employee Directory
            </h1>
            <p className="font-body-md text-secondary mt-2">
              Manage and view all active team members.
            </p>
          </div>
          <div className="flex items-center gap-space-sm w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">
                search
              </span>
              <input
                className="w-full bg-surface-container-lowest border border-border-light rounded pl-9 pr-3 py-2 font-body-md text-ink focus:outline-none focus:border-ink transition-colors"
                placeholder="Search employees..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="bg-surface-container-lowest border border-border-light text-secondary px-3 py-2 rounded flex items-center justify-center hover:bg-surface-container-low transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-xl">filter_list</span>
            </button>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-space-md">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => router.push(`/payroll/${emp.id}`)}
              className="glass-card border border-border-light rounded-xl p-space-md flex flex-col items-center text-center hover-lift cursor-pointer group relative"
            >
              {/* Status Dot mapping */}
              <div className="relative mb-4">
                {emp.avatar ? (
                  <img
                    alt={emp.name}
                    className="w-20 h-20 rounded-full object-cover border border-border-light"
                    src={emp.avatar}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center border border-border-light text-secondary font-headline-md text-3xl font-bold">
                    {emp.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                )}
                {emp.status === "Active" && (
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-success-text border-2 border-surface-container-lowest pulse-active-ring"
                    title="Active"
                  ></div>
                )}
                {emp.status === "Away" && (
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-warning-text border-2 border-surface-container-lowest"
                    title="Away"
                  ></div>
                )}
                {emp.status === "On Leave" && (
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-secondary border-2 border-surface-container-lowest flex items-center justify-center"
                    title="On Leave"
                  >
                    <span className="material-symbols-outlined text-[10px] text-white font-bold">
                      flight
                    </span>
                  </div>
                )}
              </div>

              <h3 className="font-headline-md text-headline-md text-ink font-bold group-hover:text-primary transition-colors">
                {emp.name}
              </h3>
              <p className="font-body-md text-secondary">{emp.role}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] text-secondary font-label-sm uppercase tracking-wider bg-surface-container-low px-2 py-0.5 rounded">
                  {emp.department}
                </span>
                <span className="text-[11px] text-primary font-bold font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                  ₹{(emp.salary?.base || 1200000).toLocaleString("en-IN")}/yr
                </span>
              </div>

              <div
                className="mt-4 pt-4 border-t border-border-light w-full flex justify-center gap-space-md text-secondary"
                onClick={(e) => e.stopPropagation()} // stop click bubbling
              >
                <a
                  className="hover:text-ink transition-colors p-1 hover:bg-surface-container-low rounded-full"
                  href={`mailto:${emp.email}`}
                >
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </a>
                <a
                  className="hover:text-ink transition-colors p-1 hover:bg-surface-container-low rounded-full"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Opening direct chat with ${emp.name}`);
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                </a>
              </div>
            </div>
          ))}

          {/* Add New Employee Button Card */}
          <button
            onClick={handleOpenModal}
            className="bg-transparent border border-dashed border-border-light rounded-xl p-space-md flex flex-col items-center justify-center text-center hover:bg-surface-container-lowest hover:border-secondary transition-all duration-300 h-full min-h-[220px] cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-secondary mb-3 group-hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-2xl">add</span>
            </div>
            <span className="font-label-md text-label-md text-ink font-bold">
              Add Employee
            </span>
          </button>
        </div>

        {/* Add Employee Dialog Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-55 p-gutter-mobile">
            <div className="bg-surface-container-lowest rounded-xl border border-border-light w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-space-lg border-b border-border-light flex justify-between items-center bg-slate-surface">
                <h3 className="font-headline-md text-headline-md text-primary font-bold">
                  Add New Employee
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-1 hover:bg-surface-container-low rounded-full text-secondary"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSubmit} className="p-space-lg space-y-space-md overflow-y-auto">
                <div>
                  <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 font-body-md text-ink focus:border-ink"
                    placeholder="Mahi Soni"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-space-md">
                  <div>
                    <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                      Job Role
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 font-body-md text-ink focus:border-ink"
                      placeholder="Product Designer"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                      Department
                    </label>
                    <select
                      className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 font-body-md text-ink focus:border-ink"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value as any)}
                    >
                      <option value="Design">Design</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Finance">Finance</option>
                      <option value="HR">HR</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-space-md">
                  <div>
                    <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                      Work Email
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 font-body-md text-ink focus:border-ink"
                      placeholder="mahi.soni@dayflow.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 font-body-md text-ink focus:border-ink"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                    Annual Base Salary (INR ₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-bold">₹</span>
                    <input
                      type="number"
                      required
                      className="w-full bg-surface-container-lowest border border-border-light rounded pl-8 pr-4 py-2 font-body-md text-ink focus:border-ink"
                      placeholder="1200000"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(e.target.value)}
                    />
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="pt-space-md flex justify-end gap-space-sm border-t border-border-light mt-space-lg">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="bg-surface-container-lowest border border-border-light text-secondary font-label-md text-label-md px-4 py-2 rounded hover:bg-surface-container-low cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-ink text-on-primary font-label-md text-label-md px-6 py-2 rounded hover:bg-primary font-medium cursor-pointer"
                  >
                    Add Employee
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}

export default function EmployeeDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-surface">
          <div className="text-secondary font-label-md font-bold">Loading Directory...</div>
        </div>
      }
    >
      <EmployeeDirectory />
    </Suspense>
  );
}
