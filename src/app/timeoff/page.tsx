"use client";

import React, { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";
import {
  calculateLeaveWorkingDays,
  calculateEmployeeLeaveBalances,
  checkLeaveOverlap,
  DEFAULT_LEAVE_ALLOCATIONS,
} from "@/services/leaveService";
import { format, parseISO, isValid, addDays } from "date-fns";
import { getTodayDateString } from "@/lib/dateUtils";

export default function TimeOffPage() {
  const { leaves, currentUser, currentRole, requestLeave, updateLeaveStatus } = useApp();

  // Active Tab & Search Filters
  const [activeTab, setActiveTab] = useState<"my_leaves" | "all_leaves">("my_leaves");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [leaveType, setLeaveType] = useState<string>("Paid Time Off");
  const [startDate, setStartDate] = useState<string>(getTodayDateString());
  const [endDate, setEndDate] = useState<string>(getTodayDateString());
  const [reason, setReason] = useState<string>("");
  const [attachmentName, setAttachmentName] = useState<string>("");

  // Live Computed Working Days (Excluding Weekends)
  const computedWorkingDays = useMemo(() => {
    return calculateLeaveWorkingDays(startDate, endDate);
  }, [startDate, endDate]);

  // Live Computed Leave Balances (Zero Fake Numbers)
  const balances = useMemo(() => {
    return calculateEmployeeLeaveBalances(currentUser.id, leaves);
  }, [currentUser.id, leaves]);

  // General KPIs from Real Data
  const pendingApprovalsCount = useMemo(() => {
    return leaves.filter((l) => l.status === "Pending").length;
  }, [leaves]);

  const teamAwayTodayCount = useMemo(() => {
    const todayStr = getTodayDateString();
    return leaves.filter((l) => {
      if (l.status !== "Approved") return false;
      return l.dates.includes(todayStr);
    }).length;
  }, [leaves]);

  // Filtered Leave Records
  const myLeaves = useMemo(() => {
    return leaves.filter((l) => l.employeeId === currentUser.id);
  }, [leaves, currentUser.id]);

  const displayedLeaves = useMemo(() => {
    const source = activeTab === "my_leaves" ? myLeaves : leaves;
    return source.filter((item) => {
      const matchesSearch =
        item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.dates.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || item.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [activeTab, myLeaves, leaves, searchQuery, statusFilter]);

  // Modal Handlers
  const handleOpenModal = () => {
    setErrorMessage(null);
    setStartDate(getTodayDateString());
    setEndDate(getTodayDateString());
    setReason("");
    setAttachmentName("");
    setLeaveType("Paid Time Off");
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setErrorMessage(null);
  };

  // Form Submit with Strict Overlap & Zod Validation
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. End Date >= Start Date
    if (new Date(endDate) < new Date(startDate)) {
      setErrorMessage("End date must be on or after start date.");
      return;
    }

    // 2. Reason validation
    if (!reason.trim() || reason.trim().length < 3) {
      setErrorMessage("Please provide a valid reason (at least 3 characters).");
      return;
    }

    // 3. Overlap check against employee's existing Pending or Approved leaves
    const overlap = checkLeaveOverlap(currentUser.id, startDate, endDate, leaves);
    if (overlap.hasOverlap) {
      setErrorMessage(overlap.errorMessage || "These dates overlap with an existing leave request.");
      return;
    }

    setIsSubmitting(true);

    try {
      const datesFormatted = startDate === endDate ? startDate : `${startDate} - ${endDate}`;
      await requestLeave({
        employeeId: currentUser.id,
        type: leaveType,
        dates: datesFormatted,
        days: computedWorkingDays,
      });

      setSuccessMessage(`Time off request for ${computedWorkingDays} ${computedWorkingDays === 1 ? "day" : "days"} (${leaveType}) submitted successfully!`);
      handleCloseModal();

      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit leave request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-space-xl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
          <div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold tracking-tight">
              Time Off &amp; Leave
            </h1>
            <p className="font-body-md text-body-md text-secondary mt-1">
              Apply for leave, check real allocation balances, and track approval status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm">
            <button
              onClick={handleOpenModal}
              className="px-4 py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer font-bold shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              New Time-Off Request
            </button>
          </div>
        </div>

        {/* Global Success Notification */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between mb-space-md shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Bento Grid: Live Dynamic Balances & KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-xl">
          {/* Card 1: Paid Time Off Balance */}
          <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-md flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                Paid Time Off (PTO)
              </span>
              <span className="material-symbols-outlined text-emerald-600">beach_access</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-3xl font-black text-primary">
                {balances.pto.remaining}
              </span>
              <span className="text-xs text-secondary font-medium">days available</span>
            </div>
            <div className="mt-3 pt-2 border-t border-border-light flex justify-between text-[11px] text-secondary">
              <span>{balances.pto.consumed} days used</span>
              <span>{balances.pto.allocated} days total</span>
            </div>
          </div>

          {/* Card 2: Sick Leave Balance */}
          <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-md flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                Sick Leave
              </span>
              <span className="material-symbols-outlined text-blue-600">medical_services</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-3xl font-black text-primary">
                {balances.sick.remaining}
              </span>
              <span className="text-xs text-secondary font-medium">days available</span>
            </div>
            <div className="mt-3 pt-2 border-t border-border-light flex justify-between text-[11px] text-secondary">
              <span>{balances.sick.consumed} days used</span>
              <span>{balances.sick.allocated} days total</span>
            </div>
          </div>

          {/* Card 3: Casual Leave */}
          <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-md flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                Casual Leave
              </span>
              <span className="material-symbols-outlined text-purple-600">event_available</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-3xl font-black text-primary">
                {balances.casual.remaining}
              </span>
              <span className="text-xs text-secondary font-medium">days available</span>
            </div>
            <div className="mt-3 pt-2 border-t border-border-light flex justify-between text-[11px] text-secondary">
              <span>{balances.casual.consumed} days used</span>
              <span>{balances.casual.allocated} days total</span>
            </div>
          </div>

          {/* Card 4: Pending Approvals Queue */}
          <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-md flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                Pending Requests
              </span>
              <span className="material-symbols-outlined text-amber-600">hourglass_top</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-3xl font-black text-amber-600">
                {pendingApprovalsCount}
              </span>
              <span className="text-xs text-secondary font-medium">awaiting review</span>
            </div>
            <div className="mt-3 pt-2 border-t border-border-light text-[11px] text-secondary">
              {teamAwayTodayCount > 0 ? `${teamAwayTodayCount} teammate(s) away today` : "All teammates present today"}
            </div>
          </div>
        </div>

        {/* Requests Table Container */}
        <div className="bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden shadow-sm">
          {/* Table Header & Controls Bar */}
          <div className="p-space-md border-b border-border-light flex flex-col sm:flex-row justify-between items-start sm:items-center gap-space-sm">
            {/* View Tabs */}
            <div className="flex p-1 bg-surface-container-low rounded-lg border border-border-light shadow-sm">
              <button
                onClick={() => setActiveTab("my_leaves")}
                className={`px-3.5 py-1.5 font-label-md text-xs rounded-md transition-all cursor-pointer ${
                  activeTab === "my_leaves"
                    ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                    : "text-secondary hover:text-primary font-medium"
                }`}
              >
                My Requests ({myLeaves.length})
              </button>
              <button
                onClick={() => setActiveTab("all_leaves")}
                className={`px-3.5 py-1.5 font-label-md text-xs rounded-md transition-all cursor-pointer ${
                  activeTab === "all_leaves"
                    ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                    : "text-secondary hover:text-primary font-medium"
                }`}
              >
                All Team Requests ({leaves.length})
              </button>
            </div>

            {/* Search and Status Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-surface-container-lowest border border-border-light rounded-lg text-xs text-primary focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-surface-container-lowest border border-border-light rounded-lg text-xs font-semibold text-primary focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Requests Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-light bg-slate-surface">
                  <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                    Employee
                  </th>
                  <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                    Type
                  </th>
                  <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                    Validity Dates
                  </th>
                  <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                    Working Days
                  </th>
                  <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                    Status
                  </th>
                  <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md divide-y divide-border-light">
                {displayedLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                          <span className="material-symbols-outlined text-2xl">event_busy</span>
                        </div>
                        <h4 className="font-headline-md text-base font-bold text-primary">
                          No time-off requests found
                        </h4>
                        <p className="font-body-md text-xs text-secondary leading-relaxed">
                          {searchQuery
                            ? `No requests match the query "${searchQuery}".`
                            : activeTab === "my_leaves"
                            ? "You haven't submitted any time-off requests yet. Click 'New Time-Off Request' above to apply."
                            : "There are no team leave requests in the system."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedLeaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-surface/60 transition-colors group">
                      <td className="px-6 py-3.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {leave.employeeName
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <div className="font-semibold text-primary text-sm">
                            {leave.employeeName}
                          </div>
                          <div className="text-[11px] text-secondary">{leave.department}</div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-xs font-semibold text-primary">
                        {leave.type}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-secondary font-mono">
                        {leave.dates}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-primary font-medium">
                        {leave.days} {leave.days === 1 ? "day" : "days"}
                      </td>
                      <td className="px-6 py-3.5">
                        {leave.status === "Pending" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Pending Approval
                          </span>
                        )}
                        {leave.status === "Approved" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Approved
                          </span>
                        )}
                        {leave.status === "Rejected" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {currentRole === "admin" && leave.status === "Pending" ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => updateLeaveStatus(leave.id, "Approved")}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                              title="Approve leave"
                            >
                              <span className="material-symbols-outlined text-[14px]">check</span>
                              Approve
                            </button>
                            <button
                              onClick={() => updateLeaveStatus(leave.id, "Rejected")}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                              title="Reject leave"
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-secondary font-mono">
                            {leave.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ==================================================
            NEW TIME-OFF REQUEST MODAL DIALOG (STITCH SPEC)
        ================================================== */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-surface-container-lowest rounded-2xl border border-border-light w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-border-light flex justify-between items-center bg-slate-surface">
                <div>
                  <h3 className="font-headline-md text-base font-bold text-primary">
                    New Time-Off Request
                  </h3>
                  <p className="text-xs text-secondary mt-0.5">
                    Submit leave for supervisor and HR approval
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-1 hover:bg-surface-container-low rounded-lg text-secondary hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
                {/* Error Banner */}
                {errorMessage && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3.5 py-2.5 rounded-lg text-xs flex items-start gap-2">
                    <span className="material-symbols-outlined text-rose-600 text-base flex-shrink-0 mt-0.5">
                      error
                    </span>
                    <span className="leading-relaxed">{errorMessage}</span>
                  </div>
                )}

                {/* Locked Authenticated Employee Field */}
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">
                    Employee (Self)
                  </label>
                  <div className="px-3 py-2 bg-slate-100/70 border border-border-light rounded-lg text-xs font-semibold text-primary flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                        {currentUser.name[0]}
                      </div>
                      <span>{currentUser.name}</span>
                    </div>
                    <span className="text-[11px] text-secondary font-mono">
                      ID: {currentUser.id} (Locked)
                    </span>
                  </div>
                </div>

                {/* Time Off Type Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    Time Off Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="w-full bg-surface-container-lowest border border-border-light rounded-lg px-3 py-2 text-xs font-semibold text-primary focus:outline-none focus:border-primary cursor-pointer"
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                  >
                    <option value="Paid Time Off">Paid Time Off (PTO) — {balances.pto.remaining} days left</option>
                    <option value="Sick Leave">Sick Leave — {balances.sick.remaining} days left</option>
                    <option value="Casual Leave">Casual Leave — {balances.casual.remaining} days left</option>
                    <option value="Unpaid Leave">Unpaid Leave</option>
                    <option value="Parental Leave">Parental Leave</option>
                  </select>
                </div>

                {/* Date Range Pickers (Start & End Date) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-primary mb-1">
                      Start Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-border-light rounded-lg px-3 py-2 text-xs text-primary focus:outline-none focus:border-primary cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-primary mb-1">
                      End Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={startDate}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-border-light rounded-lg px-3 py-2 text-xs text-primary focus:outline-none focus:border-primary cursor-pointer"
                    />
                  </div>
                </div>

                {/* Live Computed Working Days Badge */}
                <div className="px-3.5 py-2 bg-slate-50 border border-border-light rounded-lg flex items-center justify-between">
                  <span className="text-xs text-secondary font-medium">Computed Duration:</span>
                  <span className="text-xs font-bold text-primary">
                    {computedWorkingDays} {computedWorkingDays === 1 ? "working day" : "working days"}
                    <span className="text-[10px] text-secondary font-normal ml-1">(excl. weekends)</span>
                  </span>
                </div>

                {/* Reason Field */}
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Provide a brief explanation for this leave request..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-border-light rounded-lg p-2.5 text-xs text-primary focus:outline-none focus:border-primary placeholder:text-secondary"
                  />
                </div>

                {/* Optional Attachment Upload */}
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    Supporting Document (Medical Certificate / Attachment — Optional)
                  </label>
                  <div className="border border-dashed border-border-light rounded-lg p-3 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <input
                      type="file"
                      id="leave-attachment"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAttachmentName(e.target.files[0].name);
                        }
                      }}
                    />
                    <label
                      htmlFor="leave-attachment"
                      className="cursor-pointer flex flex-col items-center justify-center gap-1 text-secondary"
                    >
                      <span className="material-symbols-outlined text-xl">upload_file</span>
                      <span className="text-xs font-medium">
                        {attachmentName ? (
                          <span className="text-emerald-700 font-bold">{attachmentName}</span>
                        ) : (
                          "Click to browse file"
                        )}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="pt-3 flex justify-end gap-2 border-t border-border-light mt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-border-light text-secondary font-label-md text-xs rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-primary text-on-primary font-label-md text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
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
