"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  pendingLeaveCount: number;
  checkedInEmployeeIds: string[];
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  check_in: string | null;
  check_out: string | null;
  work_hours: string | null;
  status: string;
  date: string;
}

export interface LeaveRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  type: string;
  dates: string;
  days: number;
  status: "Pending" | "Approved" | "Rejected";
  department?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches HR dashboard stats: total employees, present today, pending leaves.
 * Falls back gracefully if Supabase is not configured.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const supabase = await createClient();
    const todayStr = new Date().toISOString().split("T")[0];

    // Run all queries in parallel
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

    const totalEmployees = empResult.count ?? 0;
    const presentToday = attendResult.data?.length ?? 0;
    const checkedInEmployeeIds =
      attendResult.data?.map((r) => r.employee_id) ?? [];
    const pendingLeaveCount = leaveResult.count ?? 0;

    return {
      totalEmployees,
      presentToday,
      pendingLeaveCount,
      checkedInEmployeeIds,
    };
  } catch {
    // Supabase not configured or network error — return neutral zeros
    return {
      totalEmployees: 0,
      presentToday: 0,
      pendingLeaveCount: 0,
      checkedInEmployeeIds: [],
    };
  }
}

/**
 * Returns today's attendance record for a specific employee.
 * Used for the header check-in status dot.
 */
export async function getEmployeeCheckInStatus(employeeId: string): Promise<{
  checkedIn: boolean;
  checkedOut: boolean;
  checkInTime: string | null;
}> {
  try {
    const supabase = await createClient();
    const todayStr = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("attendance")
      .select("check_in, check_out")
      .eq("employee_id", employeeId)
      .eq("date", todayStr)
      .maybeSingle();

    if (!data) {
      return { checkedIn: false, checkedOut: false, checkInTime: null };
    }

    return {
      checkedIn: !!data.check_in && data.check_in !== "--:--",
      checkedOut: !!data.check_out && data.check_out !== "--:--",
      checkInTime: data.check_in,
    };
  } catch {
    return { checkedIn: false, checkedOut: false, checkInTime: null };
  }
}

/**
 * Returns all pending leave requests — used for HR approval queue.
 */
export async function getPendingLeaves(): Promise<LeaveRecord[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("leaves")
      .select("*")
      .eq("status", "Pending")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as LeaveRecord[];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations with revalidation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Server Action: Check in an employee.
 * Upserts today's attendance row and revalidates all relevant pages.
 */
export async function serverCheckIn(
  employeeId: string,
  employeeName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const padMin = String(minutes).padStart(2, "0");
    const checkInTime = `${String(displayHours).padStart(2, "0")}:${padMin} ${ampm}`;
    const isLate = hours > 9 || (hours === 9 && minutes > 0);

    const { error } = await supabase.from("attendance").upsert(
      {
        employee_id: employeeId,
        employee_name: employeeName,
        date: todayStr,
        check_in: checkInTime,
        check_out: "--:--",
        work_hours: "--",
        extra_hours: "-",
        status: isLate ? "Late" : "Present",
      },
      { onConflict: "employee_id,date" }
    );

    if (error) return { success: false, error: error.message };

    // Audit log
    await supabase.from("audit_logs").insert({
      user: employeeName,
      action: `checked in at ${checkInTime}`,
      timestamp: "Just now",
      ip_address: "127.0.0.1",
    });

    // Revalidate all pages that show check-in state
    revalidatePath("/dashboard");
    revalidatePath("/attendance");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Check-in failed" };
  }
}

/**
 * Server Action: Check out an employee.
 * Updates today's attendance row with duration and revalidates pages.
 */
export async function serverCheckOut(
  employeeId: string,
  employeeName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Fetch existing check-in row
    const { data: existing, error: fetchErr } = await supabase
      .from("attendance")
      .select("check_in")
      .eq("employee_id", employeeId)
      .eq("date", todayStr)
      .maybeSingle();

    if (fetchErr || !existing?.check_in) {
      return { success: false, error: "No check-in record found for today" };
    }

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const padMin = String(minutes).padStart(2, "0");
    const checkOutTime = `${String(displayHours).padStart(2, "0")}:${padMin} ${ampm}`;

    // Parse check-in time for duration calculation
    const parts = existing.check_in.split(" ");
    const [inH, inM] = parts[0].split(":").map(Number);
    const inAmpm = parts[1];
    let inHrs = inH;
    if (inAmpm === "PM" && inH !== 12) inHrs += 12;
    if (inAmpm === "AM" && inH === 12) inHrs = 0;

    const checkInDate = new Date();
    checkInDate.setHours(inHrs, inM, 0);
    const diffMs = now.getTime() - checkInDate.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const workHoursStr = `${diffHrs}h ${diffMins}m`;

    let extraHoursStr = "-";
    if (diffMs > 8 * 60 * 60 * 1000) {
      const exMs = diffMs - 8 * 60 * 60 * 1000;
      const exH = Math.floor(exMs / (1000 * 60 * 60));
      const exM = Math.floor((exMs % (1000 * 60 * 60)) / (1000 * 60));
      extraHoursStr = `${exH}h ${exM}m`;
    }

    const { error } = await supabase
      .from("attendance")
      .update({
        check_out: checkOutTime,
        work_hours: workHoursStr,
        extra_hours: extraHoursStr,
      })
      .eq("employee_id", employeeId)
      .eq("date", todayStr);

    if (error) return { success: false, error: error.message };

    await supabase.from("audit_logs").insert({
      user: employeeName,
      action: `checked out at ${checkOutTime} — ${workHoursStr} total`,
      timestamp: "Just now",
      ip_address: "127.0.0.1",
    });

    revalidatePath("/dashboard");
    revalidatePath("/attendance");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Check-out failed" };
  }
}

/**
 * Server Action: Update leave status (approve / reject).
 * Revalidates the time-off and dashboard pages.
 */
export async function serverUpdateLeaveStatus(
  leaveId: string,
  status: "Approved" | "Rejected",
  adminName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("leaves")
      .update({ status })
      .eq("id", leaveId);

    if (error) return { success: false, error: error.message };

    await supabase.from("audit_logs").insert({
      user: adminName,
      action: `${status.toLowerCase()} leave request #${leaveId}`,
      timestamp: "Just now",
      ip_address: "127.0.0.1",
    });

    revalidatePath("/timeoff");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Failed to update leave" };
  }
}
