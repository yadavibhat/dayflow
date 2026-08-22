"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { deriveEmployeeLiveStatus } from "@/services/attendanceService";
import { formatTimeDisplay, getCurrentTimeString } from "@/lib/dateUtils";

export const SystrayCheckInOut: React.FC = () => {
  const { currentUser, attendance, leaves, checkIn, checkOut } = useApp();
  const [loading, setLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Derive live status based on real DB/Context state
  const liveStatus = deriveEmployeeLiveStatus(currentUser.id, attendance, leaves);

  // Auto-dismiss feedback message after 4.5 seconds
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => {
        setActionFeedback(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  const handleCheckIn = async () => {
    setLoading(true);
    setActionFeedback(null);
    try {
      // Check if already checked in
      if (liveStatus.isCheckedIn && !liveStatus.isCheckedOut) {
        setActionFeedback({
          type: "error",
          message: `Already checked in today at ${liveStatus.todayRecord?.checkIn || "earlier"}. Please check out first.`,
        });
        setLoading(false);
        return;
      }

      await checkIn(currentUser.id);
      setActionFeedback({
        type: "success",
        message: `Successfully checked in at ${getCurrentTimeString()}!`,
      });
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        message: err?.message || "Check-in failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setActionFeedback(null);
    try {
      if (!liveStatus.isCheckedIn) {
        setActionFeedback({
          type: "error",
          message: "Cannot check out: You have not checked in today.",
        });
        setLoading(false);
        return;
      }
      if (liveStatus.isCheckedOut) {
        setActionFeedback({
          type: "error",
          message: `Already checked out today at ${liveStatus.todayRecord?.checkOut}.`,
        });
        setLoading(false);
        return;
      }

      await checkOut(currentUser.id);
      setActionFeedback({
        type: "success",
        message: `Successfully checked out at ${getCurrentTimeString()}!`,
      });
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        message: err?.message || "Check-out failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center">
      {/* Systray Container */}
      <div className="flex items-center gap-3 bg-surface-container-low border border-border-light rounded-xl px-3 py-1.5 shadow-sm">
        {/* Status Dot & Label Indicator */}
        <div className="flex items-center gap-2">
          {liveStatus.dotColor === "green" && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
          )}
          {liveStatus.dotColor === "yellow" && (
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 flex-shrink-0"></span>
          )}
          {liveStatus.dotColor === "plane" && (
            <span className="material-symbols-outlined text-sm text-primary flex-shrink-0">
              flight
            </span>
          )}

          <div className="flex flex-col text-left">
            <span className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-secondary leading-none">
              {liveStatus.label}
            </span>
            {liveStatus.sinceText && (
              <span className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                {liveStatus.sinceText}
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        {liveStatus.status !== "On Leave" ? (
          !liveStatus.isCheckedIn || (liveStatus.isCheckedIn && liveStatus.isCheckedOut) ? (
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-label-md text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              title="Click to check in for today"
            >
              {loading ? (
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span className="material-symbols-outlined text-xs">login</span>
              )}
              <span>{liveStatus.isCheckedOut ? "Re-Check In" : "Check In"}</span>
            </button>
          ) : (
            <button
              onClick={handleCheckOut}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-label-md text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              title="Click to check out and finalize today's work hours"
            >
              {loading ? (
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span className="material-symbols-outlined text-xs">logout</span>
              )}
              <span>Check Out</span>
            </button>
          )
        ) : (
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-200">
            Approved Leave
          </span>
        )}
      </div>

      {/* Floating Status Feedback Toast */}
      {actionFeedback && (
        <div
          className={`absolute top-full right-0 mt-2 z-50 px-3.5 py-2 rounded-lg text-xs font-medium shadow-elevated border flex items-center gap-2 whitespace-nowrap transition-all duration-200 animate-fadeIn ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span className="material-symbols-outlined text-sm">
            {actionFeedback.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{actionFeedback.message}</span>
          <button
            onClick={() => setActionFeedback(null)}
            className="ml-1 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
