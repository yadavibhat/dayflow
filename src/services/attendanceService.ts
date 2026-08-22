import { AttendanceLog, LeaveRequest } from "@/context/AppContext";
import { CheckInInput, CheckOutInput, CheckInSchema, CheckOutSchema } from "@/lib/validations/attendance";
import { getTodayDateString, getCurrentTimeString, computeWorkedDuration, isDateInLeaveRange } from "@/lib/dateUtils";

const STORAGE_KEY_ATTENDANCE = "dayflow_attendance_records";

export interface AttendanceActionResult {
  success: boolean;
  record?: AttendanceLog;
  error?: string;
}

export function getPersistedAttendanceLogs(): AttendanceLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function savePersistedAttendanceLogs(logs: AttendanceLog[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(logs));
  } catch (err) {
    console.error("Failed to persist attendance logs to localStorage", err);
  }
}

/**
 * Returns today's attendance record for an employee, or null if none exists.
 */
export function getTodayAttendance(employeeId: string, logs?: AttendanceLog[]): AttendanceLog | null {
  const allLogs = logs || getPersistedAttendanceLogs();
  const today = getTodayDateString();
  return allLogs.find((log) => log.employeeId === employeeId && log.date === today) || null;
}

/**
 * Derives the real status of an employee for today:
 * 1. "On Leave" (Airplane) if an approved leave covers today
 * 2. "Present" (Green Dot) if checked in today
 * 3. "Absent" (Yellow Dot) if not checked in today and no approved leave
 */
export function deriveEmployeeLiveStatus(
  employeeId: string,
  attendanceLogs: AttendanceLog[],
  leaveRequests: LeaveRequest[]
): {
  status: "Present" | "Away" | "On Leave";
  dotColor: "green" | "yellow" | "plane";
  label: string;
  sinceText?: string;
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  todayRecord: AttendanceLog | null;
} {
  const today = getTodayDateString();
  const todayRecord = getTodayAttendance(employeeId, attendanceLogs);

  // Check 1: Approved Leave covering today
  const onApprovedLeave = leaveRequests.some((l) => {
    if (l.employeeId !== employeeId || l.status !== "Approved") return false;
    // Check if dates contains ISO or standard formatted range
    if (l.dates.includes("-")) {
      const parts = l.dates.split("-").map((p) => p.trim());
      if (parts.length === 2) {
        return isDateInLeaveRange(today, parts[0], parts[1]);
      }
    }
    return l.dates.includes(today);
  });

  if (onApprovedLeave) {
    return {
      status: "On Leave",
      dotColor: "plane",
      label: "On Leave",
      isCheckedIn: false,
      isCheckedOut: false,
      todayRecord,
    };
  }

  // Check 2: Active Check-In
  const isCheckedIn = !!(todayRecord && todayRecord.checkIn && todayRecord.checkIn !== "--:--");
  const isCheckedOut = !!(todayRecord && todayRecord.checkOut && todayRecord.checkOut !== "--:--");

  if (isCheckedIn && !isCheckedOut) {
    return {
      status: "Present",
      dotColor: "green",
      label: "Present",
      sinceText: `Checked in since ${todayRecord.checkIn}`,
      isCheckedIn: true,
      isCheckedOut: false,
      todayRecord,
    };
  }

  if (isCheckedIn && isCheckedOut) {
    return {
      status: "Present",
      dotColor: "green",
      label: "Present",
      sinceText: `Checked out since ${todayRecord.checkOut}`,
      isCheckedIn: true,
      isCheckedOut: true,
      todayRecord,
    };
  }

  // Check 3: Not checked in (Absent/Away)
  return {
    status: "Away",
    dotColor: "yellow",
    label: "Not Checked In",
    isCheckedIn: false,
    isCheckedOut: false,
    todayRecord: null,
  };
}

/**
 * Performs validated Check-In with duplicate open record prevention.
 */
export async function executeCheckIn(
  input: CheckInInput,
  employeeName: string,
  existingLogs: AttendanceLog[]
): Promise<AttendanceActionResult> {
  // 1. Server/Service Zod Validation
  const validation = CheckInSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues.map((e: { message: string }) => e.message).join(", "),
    };
  }

  const today = getTodayDateString();
  const currentTime = getCurrentTimeString();

  // 2. Block duplicate open record check
  const existingToday = existingLogs.find(
    (log) => log.employeeId === input.employeeId && log.date === today
  );

  if (existingToday) {
    if (existingToday.checkIn !== "--:--" && existingToday.checkOut === "--:--") {
      return {
        success: false,
        error: `Duplicate check-in blocked: You are already checked in today since ${existingToday.checkIn}. Please check out first before checking in again.`,
      };
    }
  }

  // Determine status (Shift starts 09:30 AM)
  const now = new Date();
  const shiftStart = new Date();
  shiftStart.setHours(9, 30, 0, 0);
  const status: "Present" | "Late" = now > shiftStart ? "Late" : "Present";

  const newLog: AttendanceLog = {
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    employeeId: input.employeeId,
    employeeName: employeeName || "Employee",
    checkIn: currentTime,
    checkOut: "--:--",
    workHours: "--",
    extraHours: "-",
    status,
    date: today,
  };

  const updatedLogs = [newLog, ...existingLogs.filter((l) => !(l.employeeId === input.employeeId && l.date === today))];
  savePersistedAttendanceLogs(updatedLogs);

  return {
    success: true,
    record: newLog,
  };
}

/**
 * Performs validated Check-Out with duration computation.
 */
export async function executeCheckOut(
  input: CheckOutInput,
  existingLogs: AttendanceLog[]
): Promise<AttendanceActionResult> {
  // 1. Server/Service Zod Validation
  const validation = CheckOutSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues.map((e: { message: string }) => e.message).join(", "),
    };
  }

  const today = getTodayDateString();
  const currentTime = getCurrentTimeString();

  // 2. Verify an open attendance record exists for today
  const existingToday = existingLogs.find(
    (log) => log.employeeId === input.employeeId && log.date === today
  );

  if (!existingToday || existingToday.checkIn === "--:--") {
    return {
      success: false,
      error: "Check-out failed: No active check-in record found for today. You must check in first.",
    };
  }

  if (existingToday.checkOut !== "--:--") {
    return {
      success: false,
      error: `Already checked out today at ${existingToday.checkOut}. Session is already closed.`,
    };
  }

  // 3. Compute duration safely
  const { workHours, extraHours } = computeWorkedDuration(
    existingToday.checkIn,
    currentTime,
    input.breakMinutes || 0
  );

  const updatedLog: AttendanceLog = {
    ...existingToday,
    checkOut: currentTime,
    workHours,
    extraHours,
  };

  const updatedLogs = existingLogs.map((log) => (log.id === existingToday.id ? updatedLog : log));
  savePersistedAttendanceLogs(updatedLogs);

  return {
    success: true,
    record: updatedLog,
  };
}
