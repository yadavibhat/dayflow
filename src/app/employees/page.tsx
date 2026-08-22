"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";

function EmployeeDirectory() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { employees, addEmployee, removeEmployee } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmEmp, setDeleteConfirmEmp] = useState<any>(null);

  // Form State
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState<"Design" | "Engineering" | "Marketing" | "Finance" | "HR">("Engineering");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [baseSalary, setBaseSalary] = useState("1200000");
  const [avatar, setAvatar] = useState<string>("");

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
    setAvatar("");
    // Clear ?add=true from URL
    router.replace("/employees");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("File size exceeds 2MB limit. Please choose a smaller photo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setAvatar(uploadEvent.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatar("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !email) return;

    addEmployee({
      name,
      role,
      department,
      status: "Active",
      avatar: avatar || "",
      email,
      phone,
      dob: "Not specified",
      nationality: "Indian",
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
      baseSalary: parseFloat(baseSalary) || 1200000,
    });

    // Reset Form
    setName("");
    setRole("");
    setDepartment("Engineering");
    setEmail("");
    setPhone("");
    setBaseSalary("1200000");
    setAvatar("");
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
            <p className="font-body-md text-secondary mt-1">
              Manage and view all active team members.
            </p>
          </div>
          <div className="flex items-center gap-space-sm w-full md:w-auto">
            <button
              onClick={handleOpenModal}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Add New Employee"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              NEW
            </button>
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
              {/* Top-Right Corner Status Indicator per Wireframe */}
              <div className="absolute top-3 right-3 z-10">
                {emp.status === "Active" && (
                  <span className="flex h-3 w-3" title="Present in office">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white"></span>
                  </span>
                )}
                {emp.status === "Away" && (
                  <span className="inline-block h-3 w-3 rounded-full bg-amber-400 border border-white" title="Absent / Away"></span>
                )}
                {emp.status === "On Leave" && (
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center" title="On Leave">
                    <span className="material-symbols-outlined text-[11px] font-bold">
                      flight
                    </span>
                  </span>
                )}
              </div>

              {/* Employee Avatar */}
              <div className="relative mb-4 mt-2">
                {emp.avatar ? (
                  <img
                    alt={emp.name}
                    className="w-20 h-20 rounded-full object-cover border border-border-light shadow-xs"
                    src={emp.avatar}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center border border-border-light text-secondary font-headline-md text-2xl font-bold shadow-xs">
                    {emp.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                )}
              </div>

              <h3 className="font-headline-md text-headline-md text-ink font-bold group-hover:text-primary transition-colors">
                {emp.name}
              </h3>
              <p className="font-body-md text-secondary text-xs">{emp.role}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] text-secondary font-label-sm uppercase tracking-wider bg-surface-container-low px-2 py-0.5 rounded">
                  {emp.department}
                </span>
                <span className="text-[11px] text-primary font-bold font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                  ₹{(emp.salary?.base || 1200000).toLocaleString("en-IN")}/yr
                </span>
              </div>

              <div
                className="mt-4 pt-3 border-t border-border-light w-full flex justify-center items-center gap-space-md text-secondary"
                onClick={(e) => e.stopPropagation()} // stop click bubbling
              >
                <a
                  className="hover:text-ink transition-colors p-1.5 hover:bg-surface-container-low rounded-full"
                  href={`mailto:${emp.email}`}
                  title={`Email ${emp.name}`}
                >
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </a>
                <a
                  className="hover:text-ink transition-colors p-1.5 hover:bg-surface-container-low rounded-full"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Opening direct chat with ${emp.name}`);
                  }}
                  title={`Chat with ${emp.name}`}
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                </a>
                <button
                  type="button"
                  className="hover:text-rose-600 transition-colors p-1.5 hover:bg-rose-50 rounded-full cursor-pointer text-secondary"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteConfirmEmp(emp);
                  }}
                  title={`Remove ${emp.name}'s Profile`}
                >
                  <span className="material-symbols-outlined text-[18px] text-rose-500 hover:text-rose-700">delete</span>
                </button>
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
                {/* Profile Picture Upload & Remove Section */}
                <div className="flex items-center gap-4 p-3 bg-slate-50 border border-border-light rounded-xl">
                  <div className="relative">
                    {avatar ? (
                      <img
                        alt="Employee Avatar Preview"
                        className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shadow-xs"
                        src={avatar}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center border border-border-light text-secondary font-bold text-xl">
                        {name ? name.split(" ").map((n) => n[0]).join("") : <span className="material-symbols-outlined text-2xl">person</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="block text-xs font-bold text-primary">
                      Profile Picture (Optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 bg-surface-container-lowest hover:bg-surface-container-low text-primary border border-border-light rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">upload</span>
                        <span>{avatar ? "Change Photo" : "Upload Photo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                      {avatar && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-secondary">
                      PNG, JPG, or GIF up to 2MB.
                    </p>
                  </div>
                </div>

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

        {/* Delete / Remove Profile Confirmation Dialog */}
        {deleteConfirmEmp && (
          <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs flex items-center justify-center z-55 p-gutter-mobile">
            <div className="bg-surface-container-lowest rounded-xl border border-border-light w-full max-w-md shadow-2xl p-space-lg animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 mb-space-md">
                <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
                  <span className="material-symbols-outlined text-xl">delete_forever</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-base font-bold text-primary">
                    Remove Employee Profile
                  </h3>
                  <p className="text-xs text-secondary">
                    This action will delete the profile record.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-border-light rounded-lg mb-space-lg text-xs space-y-1">
                <p className="font-bold text-primary">{deleteConfirmEmp.name}</p>
                <p className="text-secondary">{deleteConfirmEmp.role} • {deleteConfirmEmp.department}</p>
                <p className="font-mono text-secondary">{deleteConfirmEmp.email}</p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border-light">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmEmp(null)}
                  className="px-4 py-2 border border-border-light text-secondary text-xs font-semibold rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await removeEmployee(deleteConfirmEmp.id);
                    setDeleteConfirmEmp(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Confirm Removal
                </button>
              </div>
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
