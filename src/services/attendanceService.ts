import { AttendanceLog, LeaveRequest } from "@/context/AppContext";
import { CheckInInput, CheckOutInput, CheckInSchema, CheckOutSchema } from "@/lib/validations/attendance";
import {
  getTodayDateString,
  getCurrentTimeString,
  computeWorkedDuration,
  isDateInLeaveRange,
} from "@/lib/dateUtils";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWeekend,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  isAfter,
  startOfDay,
  isValid,
} from "date-fns";

const STORAGE_KEY_ATTENDANCE = "dayflow_attendance_records";

export interface AttendanceActionResult {
  success: boolean;
  record?: AttendanceLog;
  error?: string;
}

export type DerivedDayStatusType = "Present" | "Late" | "Half-day" | "Leave" | "Absent" | "Weekend";

export interface DerivedDayStatus {
  status: DerivedDayStatusType;
  badgeClass: string;
  checkIn: string;
  checkOut: string;
  workHours: string;
  extraHours: string;
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
 * Reusable, deterministic daily status derivation.
 * Business Rules:
 * 1. Approved Leave overrides attendance -> "Leave".
 * 2. Weekend (Sat/Sun) -> "Weekend".
 * 3. Checked in with work hours < 4.5h -> "Half-day".
 * 4. Checked in after 09:30 AM -> "Late".
 * 5. Checked in with full shift (>= 4.5h) -> "Present".
 * 6. Working day in past/today with no check-in and no leave -> "Absent".
 */
export function deriveDailyAttendanceStatus(
  dayDate: Date,
  record?: AttendanceLog | null,
  userLeaves: LeaveRequest[] = []
): DerivedDayStatus {
  const dayStr = format(dayDate, "yyyy-MM-dd");
  const today = startOfDay(new Date());
  const isPastOrToday = !isAfter(startOfDay(dayDate), today);
  const isWeekendDay = isWeekend(dayDate);

  // Rule 1: Check if date falls in an approved leave range (Leave precedence)
  const onLeave = userLeaves.some((l) => {
    if (l.status !== "Approved") return false;
    if (l.dates.includes(dayStr)) return true;
    if (l.dates.includes("-")) {
      const parts = l.dates.split("-").map((p) => p.trim());
      if (parts.length === 2) {
        return isDateInLeaveRange(dayStr, parts[0], parts[1]);
      }
    }
    return false;
  });

  if (onLeave) {
    return {
      status: "Leave",
      badgeClass: "bg-blue-50 text-blue-700 border border-blue-200",
      checkIn: "--:--",
      checkOut: "--:--",
      workHours: "--",
      extraHours: "-",
    };
  }

  // Rule 2: Weekend
  if (isWeekendDay) {
    return {
      status: "Weekend",
      badgeClass: "bg-slate-100 text-slate-500 border border-slate-200",
      checkIn: "--:--",
      checkOut: "--:--",
      workHours: "--",
      extraHours: "-",
    };
  }

  // Rule 3: Check real attendance record
  if (record && record.checkIn && record.checkIn !== "--:--") {
    // Check half-day threshold (< 4.5 hours worked)
    if (record.workHours && record.workHours !== "--") {
      const match = record.workHours.match(/(\d+)h\s*(\d*)m?/);
      if (match) {
        const h = parseInt(match[1] || "0");
        const m = parseInt(match[2] || "0");
        const totalHours = h + m / 60;
        if (totalHours > 0 && totalHours < 4.5) {
          return {
            status: "Half-day",
            badgeClass: "bg-purple-50 text-purple-700 border border-purple-200",
            checkIn: record.checkIn,
            checkOut: record.checkOut,
            workHours: record.workHours,
            extraHours: record.extraHours,
          };
        }
      }
    }

    if (record.status === "Late") {
      return {
        status: "Late",
        badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        workHours: record.workHours,
        extraHours: record.extraHours,
      };
    }

    return {
      status: "Present",
      badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      workHours: record.workHours,
      extraHours: record.extraHours,
    };
  }

  // Rule 4: Unattended past or today working day -> Absent
  if (isPastOrToday) {
    return {
      status: "Absent",
      badgeClass: "bg-rose-50 text-rose-700 border border-rose-200",
      checkIn: "--:--",
      checkOut: "--:--",
      workHours: "--",
      extraHours: "-",
    };
  }

  // Future working day
  return {
    status: "Weekend",
    badgeClass: "bg-slate-50 text-slate-400 border border-slate-100",
    checkIn: "--:--",
    checkOut: "--:--",
    workHours: "--",
    extraHours: "-",
  };
}

/**
 * Derives the live status indicator for the systray / header.
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
 * Computes monthly summary metrics dynamically from real records.
 */
export function calculateEmployeeAttendanceSummary(
  targetMonth: Date,
  attendanceLogs: AttendanceLog[],
  leaveRequests: LeaveRequest[]
) {
  const monthStart = startOfMonth(targetMonth);
  const monthEnd = endOfMonth(targetMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  let daysPresent = 0;
  let daysLate = 0;
  let daysHalfDay = 0;
  let daysAbsent = 0;
  let daysLeave = 0;
  let totalWorkingDays = 0;
  let totalWorkedMinutes = 0;

  daysInMonth.forEach((dayDate) => {
    const dateStr = format(dayDate, "yyyy-MM-dd");
    const record = attendanceLogs.find((a) => a.date === dateStr);
    const derived = deriveDailyAttendanceStatus(dayDate, record, leaveRequests);

    if (!isWeekend(dayDate)) {
      totalWorkingDays++;
    }

    if (derived.status === "Present") daysPresent++;
    else if (derived.status === "Late") {
      daysPresent++;
      daysLate++;
    } else if (derived.status === "Half-day") {
      daysHalfDay++;
    } else if (derived.status === "Leave") {
      daysLeave++;
    } else if (derived.status === "Absent") {
      daysAbsent++;
    }

    if (derived.workHours && derived.workHours !== "--") {
      const match = derived.workHours.match(/(\d+)h\s*(\d*)m?/);
      if (match) {
        totalWorkedMinutes += parseInt(match[1] || "0") * 60 + parseInt(match[2] || "0");
      }
    }
  });

  const totalHours = `${Math.floor(totalWorkedMinutes / 60)}h ${totalWorkedMinutes % 60}m`;

  return {
    daysPresent,
    daysLate,
    daysHalfDay,
    daysAbsent,
    daysLeave,
    totalWorkingDays,
    totalHours,
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
  const validation = CheckInSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues.map((e: { message: string }) => e.message).join(", "),
    };
  }

  const today = getTodayDateString();
  const currentTime = getCurrentTimeString();

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
  const validation = CheckOutSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues.map((e: { message: string }) => e.message).join(", "),
    };
  }

  const today = getTodayDateString();
  const currentTime = getCurrentTimeString();

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
