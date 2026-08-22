"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";
import { reviewLeaveRequest } from "@/actions/leaveActions";
import { calculateEmployeeLeaveBalances, parseLeaveRange } from "@/services/leaveService";
import { LeaveRequest } from "@/lib/validations/schemas";
import { format } from "date-fns";

export default function HRLeaveApprovalPage() {
  const { leaves, employees, currentUser, currentRole, updateLeaveStatus, addAuditLog } = useApp();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");

  // Detail Modal & Action State
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [approverComment, setApproverComment] = useState("");
  const [actionType, setActionType] = useState<"Approved" | "Rejected" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Security Check: Role must be HR/Admin
  const isAuthorized = currentRole === "admin";

  // 1. UNAUTHORIZED ACCESS STATE (CRITICAL SECURITY GUARD)
  if (!isAuthorized) {
    return (
      <DashboardLayout>
        <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-space-xl">
          <div className="bg-surface-container-lowest border border-rose-200 rounded-2xl p-8 max-w-lg mx-auto shadow-sm text-center">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <span className="material-symbols-outlined text-3xl">gavel</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
              403 — HR Authorization Required
            </h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              You are currently signed in with an <strong>Employee</strong> role. Leave approval queues, employee entitlement balances, and approval decisions are restricted to HR/Admin roles.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/timeoff"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all text-center"
              >
                Go to My Time Off
              </Link>
              <Link
                href="/"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-all text-center"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  // Real Pending Queue from DB/Context
  const pendingLeaves = useMemo(() => {
    return leaves.filter((l) => l.status === "Pending");
  }, [leaves]);

  // Filtered Pending Queue
  const filteredQueue = useMemo(() => {
    return pendingLeaves.filter((leave) => {
      const matchesSearch =
        leave.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.dates.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        typeFilter === "All" || leave.type.toLowerCase() === typeFilter.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [pendingLeaves, searchQuery, typeFilter]);

  // Selected Employee Profile & Entitlement Context
  const selectedEmployee = useMemo(() => {
    if (!selectedLeave) return null;
    return employees.find((e) => e.id === selectedLeave.employeeId) || null;
  }, [selectedLeave, employees]);

  const selectedEmployeeBalances = useMemo(() => {
    if (!selectedLeave) return null;
    return calculateEmployeeLeaveBalances(selectedLeave.employeeId, leaves);
  }, [selectedLeave, leaves]);

  // Open Detail Modal
  const handleOpenDetailModal = (leave: LeaveRequest, action?: "Approved" | "Rejected") => {
    setSelectedLeave(leave);
    setApproverComment("");
    setActionType(action || null);
    setErrorMessage(null);
  };

  const handleCloseModal = () => {
    setSelectedLeave(null);
    setApproverComment("");
    setActionType(null);
    setErrorMessage(null);
  };

  // Execute Leave Decision with Server-Side Guard
  const handleExecuteDecision = async (decision: "Approved" | "Rejected") => {
    if (!selectedLeave) return;
    setErrorMessage(null);

    // Rejection requires comment
    if (decision === "Rejected" && (!approverComment || approverComment.trim().length < 3)) {
      setErrorMessage("Please provide a reason for rejecting this leave request (min 3 characters).");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Invoke Server Action with caller role verification
      const serverResult = await reviewLeaveRequest({
        leaveId: selectedLeave.id,
        action: decision,
        approverComment: approverComment.trim(),
        approverId: currentUser.id,
        approverRole: currentRole,
      });

      if (!serverResult.success) {
        throw new Error(serverResult.error || "Server rejected leave review mutation.");
      }

      // 2. Update local state and context
      await updateLeaveStatus(selectedLeave.id, decision);

      // 3. Add audit log
      addAuditLog(
        `${decision.toLowerCase()} ${selectedLeave.type} for ${selectedLeave.employeeName} (${selectedLeave.dates})`,
        currentUser.name
      );

      // 4. Success feedback toast
      setSuccessToast(
        `Leave request for ${selectedLeave.employeeName} has been ${decision.toLowerCase()} successfully.`
      );
      handleCloseModal();

      setTimeout(() => {
        setSuccessToast(null);
      }, 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit leave decision.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-space-xl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-space-md mb-space-lg">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold rounded-md uppercase tracking-wider">
                HR / Admin Portal
              </span>
            </div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold tracking-tight">
              Leave Approvals &amp; Requests
            </h1>
            <p className="font-body-md text-body-md text-secondary mt-0.5">
              Review pending employee time-off requests, check leave entitlements, and authorize absences.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/timeoff"
              className="px-3.5 py-2 bg-surface-container-low hover:bg-surface-container-high text-primary border border-border-light rounded-lg font-label-md text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Time Off Overview
            </Link>
          </div>
        </div>

        {/* Global Success Notification */}
        {successToast && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between mb-space-md shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Filter & Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl border border-border-light shadow-sm mb-space-md">
          <div className="flex flex-wrap items-center gap-space-sm flex-1">
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">
                search
              </span>
              <input
                type="text"
                placeholder="Search by employee or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-border-light rounded-lg text-xs text-primary focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-secondary">Leave Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-surface-container-lowest border border-border-light rounded-lg text-xs font-semibold text-primary focus:outline-none cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Paid Time Off">Paid Time Off</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
                <option value="Parental Leave">Parental Leave</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-secondary">
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
              {pendingLeaves.length} Pending Approval
            </span>
          </div>
        </div>

        {/* Pending Requests Table (Stitch Spec) */}
        <div className="bg-surface-container-lowest rounded-xl border border-border-light overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-surface border-b border-border-light">
                  <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                    Employee
                  </th>
                  <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                    Type
                  </th>
                  <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                    Dates Range
                  </th>
                  <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                    Duration
                  </th>
                  <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                    Status
                  </th>
                  <th className="px-6 py-3 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold text-right">
                    Review Decision
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md divide-y divide-border-light">
                {filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1 border border-emerald-100">
                          <span className="material-symbols-outlined text-2xl">verified</span>
                        </div>
                        <h4 className="font-headline-md text-base font-bold text-primary">
                          No pending requests
                        </h4>
                        <p className="font-body-md text-xs text-secondary leading-relaxed">
                          {searchQuery
                            ? `No pending requests match "${searchQuery}".`
                            : "All submitted employee leave requests have been reviewed and processed."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map((leave) => (
                    <tr
                      key={leave.id}
                      className="hover:bg-slate-surface/60 transition-colors"
                    >
                      <td className="px-6 py-3.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {leave.employeeName
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <span className="font-semibold text-primary block text-sm">
                            {leave.employeeName}
                          </span>
                          <span className="text-[11px] text-secondary font-mono">
                            {leave.department} • ID: {leave.employeeId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-xs font-semibold text-primary">
                        {leave.type}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-secondary font-mono">
                        {leave.dates}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-primary font-medium">
                        {leave.days} {leave.days === 1 ? "working day" : "working days"}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Pending Review
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => handleOpenDetailModal(leave)}
                            className="px-3 py-1 bg-surface-container-low hover:bg-surface-container-high text-primary text-xs font-bold rounded-lg border border-border-light transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                            Review
                          </button>
                          <button
                            onClick={() => handleOpenDetailModal(leave, "Approved")}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                            title="Quick Approve"
                          >
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenDetailModal(leave, "Rejected")}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                            title="Reject"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ==================================================
            LEAVE DETAIL & DECISION MODAL (STITCH SPEC)
        ================================================== */}
        {selectedLeave && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-surface-container-lowest rounded-2xl border border-border-light w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-border-light flex justify-between items-center bg-slate-surface">
                <div>
                  <h3 className="font-headline-md text-base font-bold text-primary">
                    Review Leave Request
                  </h3>
                  <p className="text-xs text-secondary mt-0.5">
                    Evaluate entitlement balance and take approval decision
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-1 hover:bg-surface-container-low rounded-lg text-secondary hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                {errorMessage && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3.5 py-2.5 rounded-lg text-xs flex items-start gap-2">
                    <span className="material-symbols-outlined text-rose-600 text-base flex-shrink-0 mt-0.5">
                      error
                    </span>
                    <span className="leading-relaxed">{errorMessage}</span>
                  </div>
                )}

                {/* Employee Snapshot Card */}
                <div className="p-3.5 bg-slate-50 border border-border-light rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {selectedLeave.employeeName.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div>
                      <h4 className="font-bold text-primary text-sm">
                        {selectedLeave.employeeName}
                      </h4>
                      <p className="text-xs text-secondary">
                        {selectedEmployee?.role || "Employee"} • {selectedLeave.department}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-secondary bg-white px-2 py-1 rounded border border-border-light">
                    ID: {selectedLeave.employeeId}
                  </span>
                </div>

                {/* Request Details Grid */}
                <div className="grid grid-cols-2 gap-3 bg-surface-container-lowest p-3 rounded-xl border border-border-light text-xs">
                  <div>
                    <span className="text-secondary font-semibold block mb-0.5">Leave Type:</span>
                    <span className="font-bold text-primary">{selectedLeave.type}</span>
                  </div>
                  <div>
                    <span className="text-secondary font-semibold block mb-0.5">Working Days:</span>
                    <span className="font-bold text-primary">{selectedLeave.days} days</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-border-light">
                    <span className="text-secondary font-semibold block mb-0.5">Validity Dates:</span>
                    <span className="font-mono text-primary font-bold">{selectedLeave.dates}</span>
                  </div>
                </div>

                {/* Live Entitlement Context */}
                {selectedEmployeeBalances && (
                  <div className="bg-blue-50/50 border border-blue-200/70 rounded-xl p-3">
                    <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block mb-1.5">
                      Employee Leave Entitlement Context
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2 rounded border border-blue-100">
                        <span className="text-secondary text-[11px] block">PTO Remaining:</span>
                        <span className="font-black text-primary text-sm">
                          {selectedEmployeeBalances.pto.remaining} days
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded border border-blue-100">
                        <span className="text-secondary text-[11px] block">Sick Leave Remaining:</span>
                        <span className="font-black text-primary text-sm">
                          {selectedEmployeeBalances.sick.remaining} days
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Approver Decision Notes Input */}
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    Approver Comment / Decision Notes{" "}
                    <span className="text-rose-500 font-normal text-[11px]">
                      (Required for Rejections)
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Add an optional approval note or provide the reason for rejection..."
                    value={approverComment}
                    onChange={(e) => setApproverComment(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-border-light rounded-lg p-2.5 text-xs text-primary focus:outline-none focus:border-primary placeholder:text-secondary"
                  />
                </div>

                {/* Decision Actions */}
                <div className="pt-3 flex justify-between items-center border-t border-border-light mt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-border-light text-secondary font-label-md text-xs rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    Discard
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleExecuteDecision("Rejected")}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-label-md text-xs font-bold rounded-lg border border-rose-200 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                      Reject Request
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleExecuteDecision("Approved")}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-label-md text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                          Updating...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">check</span>
                          Approve Leave
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
