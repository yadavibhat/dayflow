"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { DashboardStats } from "@/lib/services/dashboard";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return (
    url !== "" &&
    key !== "" &&
    !url.includes("your-placeholder") &&
    !key.includes("your-placeholder")
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// useDashboardStats — live HR stats with real-time subscriptions
// ─────────────────────────────────────────────────────────────────────────────

interface UseDashboardStatsOptions {
  /** Fallback values when Supabase is not configured (from AppContext) */
  fallback?: Partial<DashboardStats>;
}

export function useDashboardStats(opts: UseDashboardStatsOptions = {}) {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: opts.fallback?.totalEmployees ?? 0,
    presentToday: opts.fallback?.presentToday ?? 0,
    pendingLeaveCount: opts.fallback?.pendingLeaveCount ?? 0,
    checkedInEmployeeIds: opts.fallback?.checkedInEmployeeIds ?? [],
  });
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setUsingFallback(true);
      setLoading(false);
      return;
    }

    try {
      const todayStr = new Date().toISOString().split("T")[0];

      const [empResult, attendResult, leaveResult] = await Promise.all([
        supabase.from("employees").select("id", { count: "exact", head: true }),
        supabase
          .from("attendance")
          .select("employee_id")
          .eq("date", todayStr)
          .in("status", ["Present", "Late"]),
        supabase
          .from("leaves")
          .select("id", { count: "exact", head: true })
          .eq("status", "Pending"),
      ]);

      setStats({
        totalEmployees: empResult.count ?? 0,
        presentToday: attendResult.data?.length ?? 0,
        pendingLeaveCount: leaveResult.count ?? 0,
        checkedInEmployeeIds:
          attendResult.data?.map((r) => r.employee_id) ?? [],
      });
      setUsingFallback(false);
    } catch {
      // Network error — stay on fallback
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    if (!isSupabaseConfigured()) return;

    // Subscribe to real-time changes on attendance and leaves tables
    const attendanceSub = supabase
      .channel("attendance-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance" },
        () => fetchStats()
      )
      .subscribe();

    const leavesSub = supabase
      .channel("leaves-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leaves" },
        () => fetchStats()
      )
      .subscribe();

    const employeesSub = supabase
      .channel("employees-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(attendanceSub);
      supabase.removeChannel(leavesSub);
      supabase.removeChannel(employeesSub);
    };
  }, [fetchStats]);

  return { stats, loading, usingFallback, refetch: fetchStats };
}

// ─────────────────────────────────────────────────────────────────────────────
// useCheckInStatus — live per-employee check-in dot
// ─────────────────────────────────────────────────────────────────────────────

export interface CheckInStatus {
  checkedIn: boolean;
  checkedOut: boolean;
  checkInTime: string | null;
}

export function useCheckInStatus(
  employeeId: string,
  /** Fallback from AppContext local state */
  fallbackStatus?: CheckInStatus
) {
  const [status, setStatus] = useState<CheckInStatus>(
    fallbackStatus ?? { checkedIn: false, checkedOut: false, checkInTime: null }
  );

  const fetchStatus = useCallback(async () => {
    if (!isSupabaseConfigured() || !employeeId) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("attendance")
      .select("check_in, check_out")
      .eq("employee_id", employeeId)
      .eq("date", todayStr)
      .maybeSingle();

    if (!data) {
      setStatus({ checkedIn: false, checkedOut: false, checkInTime: null });
      return;
    }

    setStatus({
      checkedIn: !!data.check_in && data.check_in !== "--:--",
      checkedOut: !!data.check_out && data.check_out !== "--:--",
      checkInTime: data.check_in,
    });
  }, [employeeId]);

  useEffect(() => {
    fetchStatus();

    if (!isSupabaseConfigured() || !employeeId) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const sub = supabase
      .channel(`check-in-${employeeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
          filter: `employee_id=eq.${employeeId}`,
        },
        () => fetchStatus()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [employeeId, fetchStatus]);

  return { status, refetch: fetchStatus };
}
