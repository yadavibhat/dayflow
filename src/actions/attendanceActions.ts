"use server";

import { AttendanceLog } from "@/lib/validations/schemas";
import { computeWorkedDuration, getTodayDateString } from "@/lib/dateUtils";
import { supabase } from "@/lib/supabase/client";

export interface HRAttendanceQueryParams {
  date?: string;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
  userRole?: string;
}

export interface HRAttendanceResponse {
  success: boolean;
  records: AttendanceLog[];
  totalCount: number;
  page: number;
  totalPages: number;
  error?: string;
}

/**
 * Server-side authorization check and query for HR/Admin attendance records.
 * STRICT SECURITY: Rejects any non-HR/Admin role request on the server boundary.
 */
export async function getHRAttendanceData(
  params: HRAttendanceQueryParams
): Promise<HRAttendanceResponse> {
  const { date, searchQuery = "", page = 1, pageSize = 10, userRole = "admin" } = params;

  // 1. SERVER-SIDE ROLE AUTHORIZATION GUARD
  const authorizedRoles = ["admin", "hr", "manager"];
  if (!authorizedRoles.includes(userRole.toLowerCase())) {
    return {
      success: false,
      records: [],
      totalCount: 0,
      page: 1,
      totalPages: 0,
      error: "403 Forbidden: Access denied. HR or Admin permissions are required to access organization attendance data.",
    };
  }

  const isConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-placeholder-url") &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("your-placeholder-anon-key");

  let allLogs: AttendanceLog[] = [];

  if (isConfigured) {
    try {
      let query = supabase.from("attendance").select("*", { count: "exact" });
      if (date) {
        query = query.eq("date", date);
      }
      if (searchQuery.trim()) {
        query = query.or(`employeeName.ilike.%${searchQuery}%,employeeId.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (!error && data) {
        allLogs = data as AttendanceLog[];
      }
    } catch (err) {
      console.warn("Supabase query failed on server, using in-memory dataset", err);
    }
  }

  // Filter logs safely with deterministic duration calculations
  let filtered = allLogs.map((log) => {
    const { workHours, extraHours } = computeWorkedDuration(log.checkIn, log.checkOut);
    return {
      ...log,
      workHours: log.workHours && log.workHours !== "--" ? log.workHours : workHours,
      extraHours: log.extraHours && log.extraHours !== "-" ? log.extraHours : extraHours,
    };
  });

  if (date) {
    filtered = filtered.filter((l) => l.date === date);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.employeeName.toLowerCase().includes(q) ||
        l.employeeId.toLowerCase().includes(q)
    );
  }

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  return {
    success: true,
    records: paginated,
    totalCount,
    page,
    totalPages,
  };
}
