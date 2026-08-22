"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";

export default function TimeOffPage() {
  const { leaves, currentUser, requestLeave, updateLeaveStatus } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [leaveType, setLeaveType] = useState("Paid Time Off");
  const [dates, setDates] = useState("");
  const [days, setDays] = useState("3");

  const pendingApprovals = leaves.filter((l) => l.status === "Pending").length;
  const teamAwayToday = leaves.filter((l) => l.status === "Approved").length;

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dates || !days) return;

    requestLeave({
      employeeId: currentUser.id,
      type: leaveType,
      dates,
      days: parseFloat(days) || 1,
    });

    setDates("");
    setDays("3");
    setLeaveType("Paid Time Off");
    handleCloseModal();
  };

  const filteredLeaves = leaves.filter((l) =>
    l.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-space-xl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
          <div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-ink font-bold">
              Time Off &amp; Leave
            </h1>
            <p className="font-body-md text-body-md text-secondary mt-1">
              Manage employee leave requests and balances.
            </p>
          </div>
          <div className="flex gap-space-sm w-full md:w-auto">
            <button
              onClick={() => alert("Leave logs exported successfully!")}
              className="px-space-md py-2 bg-surface-container-lowest border border-border-light rounded-lg text-secondary font-label-md text-label-md hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export
            </button>
            <button
              onClick={handleOpenModal}
              className="px-space-md py-2 bg-ink text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Request
            </button>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md mb-space-xxl">
          {/* Card 1: Pending Approvals */}
          <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-md flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                  Pending Approvals
                </span>
                <span className="material-symbols-outlined text-warning-text">hourglass_empty</span>
              </div>
              <div className="font-headline-lg text-headline-lg text-ink font-bold">
                {pendingApprovals}
              </div>
            </div>
            <div className="mt-space-md pt-space-sm border-t border-border-light">
              <a
                className="font-label-md text-label-md text-ink hover:underline flex items-center gap-1 font-bold"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setSearchQuery("Pending");
                }}
              >
                Review all pending
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </a>
            </div>
          </div>

          {/* Card 2: Team Away Today */}
          <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-md flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                  Team Away Today
                </span>
                <span className="material-symbols-outlined text-ink">group_remove</span>
              </div>
              <div className="font-headline-lg text-headline-lg text-ink font-bold">
                {teamAwayToday}
              </div>
            </div>
            <div className="mt-space-md pt-space-sm border-t border-border-light flex gap-2 overflow-hidden items-center">
              {leaves
                .filter((l) => l.status === "Approved")
                .slice(0, 3)
                .map((l) =>
                  l.avatar ? (
                    <img
                      key={l.id}
                      alt={l.employeeName}
                      className="w-6 h-6 rounded-full border border-border-light object-cover"
                      src={l.avatar}
                      title={l.employeeName}
                    />
                  ) : (
                    <div
                      key={l.id}
                      className="w-6 h-6 rounded-full bg-surface-container-low border border-border-light flex items-center justify-center font-label-sm text-[10px] text-secondary font-bold"
                      title={l.employeeName}
                    >
                      {l.employeeName.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                  )
                )}
              {teamAwayToday > 3 && (
                <div className="w-6 h-6 rounded-full bg-surface-container-low border border-border-light flex items-center justify-center font-label-sm text-[10px] text-secondary font-bold">
                  +{teamAwayToday - 3}
                </div>
              )}
              {teamAwayToday === 0 && (
                <span className="text-[12px] text-secondary font-medium">All present today</span>
              )}
            </div>
          </div>

          {/* Card 3: Your PTO Balance */}
          <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-md flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                  Your PTO Balance
                </span>
                <span className="material-symbols-outlined text-success-text">event_available</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-lg text-headline-lg text-ink font-bold">18</span>
                <span className="font-body-md text-body-md text-secondary">days left</span>
              </div>
            </div>
            <div className="mt-space-md">
              <div className="w-full bg-surface-container-low rounded-full h-1.5 mb-1 overflow-hidden">
                <div className="bg-ink h-1.5 rounded-full" style={{ width: "45%" }}></div>
              </div>
              <div className="flex justify-between font-label-sm text-[10px] text-secondary">
                <span>12 taken</span>
                <span>30 total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Data Table */}
        <div className="bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden shadow-sm">
          <div className="p-space-md border-b border-border-light flex flex-col sm:flex-row justify-between items-center gap-space-sm">
            <h2 className="font-headline-md text-headline-md text-ink font-bold">
              Recent Leave Requests
            </h2>
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
                search
              </span>
              <input
                className="w-full pl-10 pr-3 py-2 bg-surface border border-border-light rounded-lg text-body-md font-body-md text-ink focus:outline-none focus:border-ink transition-colors"
                placeholder="Search employee..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-light bg-slate-surface">
                  <th className="p-space-md font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                    Employee
                  </th>
                  <th className="p-space-md font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                    Type
                  </th>
                  <th className="p-space-md font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                    Dates
                  </th>
                  <th className="p-space-md font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                    Duration
                  </th>
                  <th className="p-space-md font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                    Status
                  </th>
                  <th className="p-space-md font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface-variant divide-y divide-border-light">
                {filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-secondary font-body-md">
                      No leave requests found.
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-surface transition-colors group">
                      <td className="p-space-md">
                        <div className="flex items-center gap-3">
                          {leave.avatar ? (
                            <img
                              alt={leave.employeeName}
                              className="w-8 h-8 rounded-full border border-border-light object-cover"
                              src={leave.avatar}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-secondary text-[12px] border border-border-light">
                              {leave.employeeName.split(" ").map((n: string) => n[0]).join("")}
                            </div>
                          )}
                          <div>
                            <div className="font-label-md text-ink font-bold">{leave.employeeName}</div>
                            <div className="text-[12px] text-secondary">{leave.department}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-space-md">{leave.type}</td>
                      <td className="p-space-md text-secondary">{leave.dates}</td>
                      <td className="p-space-md">{leave.days} {leave.days === 1 ? "day" : "days"}</td>
                      <td className="p-space-md">
                        {leave.status === "Pending" && (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-warning-soft text-warning-text font-label-sm text-[10px] uppercase tracking-wider border border-[#fde68a] font-bold">
                            Pending
                          </span>
                        )}
                        {leave.status === "Approved" && (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-success-soft text-success-text font-label-sm text-[10px] uppercase tracking-wider border border-[#bbf7d0] font-bold">
                            Approved
                          </span>
                        )}
                        {leave.status === "Rejected" && (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-danger-soft text-danger-text font-label-sm text-[10px] uppercase tracking-wider border border-[#fecaca] font-bold">
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="p-space-md text-right">
                        {leave.status === "Pending" ? (
                          <div className="flex justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => updateLeaveStatus(leave.id, "Approved")}
                              className="p-1 text-success-text hover:bg-success-soft rounded border border-transparent hover:border-[#bbf7d0] transition-colors cursor-pointer"
                              title="Approve"
                            >
                              <span className="material-symbols-outlined text-[20px] font-bold">check</span>
                            </button>
                            <button
                              onClick={() => updateLeaveStatus(leave.id, "Rejected")}
                              className="p-1 text-danger-text hover:bg-danger-soft rounded border border-transparent hover:border-[#fecaca] transition-colors cursor-pointer"
                              title="Reject"
                            >
                              <span className="material-symbols-outlined text-[20px] font-bold">close</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => alert(`Details: Leave request for ${leave.employeeName} is ${leave.status}`)}
                            className="p-1 text-secondary hover:text-ink transition-colors lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              </table>
          </div>
        </div>

        {/* New Leave Request Modal Dialog */}
        {modalOpen && (
          <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-55 p-gutter-mobile">
            <div className="bg-surface-container-lowest rounded-xl border border-border-light w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-space-lg border-b border-border-light flex justify-between items-center bg-slate-surface">
                <h3 className="font-headline-md text-headline-md text-primary font-bold">
                  Request Time Off
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-1 hover:bg-surface-container-low rounded-full text-secondary"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSubmit} className="p-space-lg space-y-space-md">
                <div>
                  <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                    Leave Type
                  </label>
                  <select
                    className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 font-body-md text-ink focus:border-ink"
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                  >
                    <option value="Paid Time Off">Paid Time Off (PTO)</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Parental Leave">Parental Leave</option>
                    <option value="Unpaid Leave">Unpaid Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                    Dates
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 font-body-md text-ink focus:border-ink"
                    placeholder="e.g. Nov 01 - Nov 05"
                    value={dates}
                    onChange={(e) => setDates(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-ink mb-1 font-bold">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    className="w-full bg-surface-container-lowest border border-border-light rounded px-3 py-2 font-body-md text-ink focus:border-ink"
                    placeholder="3"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                  />
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
                    Submit Request
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
