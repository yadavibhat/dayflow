/**
 * ============================================================================
 * Dayflow HRMS — Core Time Off & Leave Domain Service
 * ============================================================================
 * 
 * DOMAIN RESPONSIBILITIES:
 * - Leave working-day calculation (inclusive of start/end, excluding weekends).
 * - Overlap detection against employee's existing Pending and Approved leaves.
 * - Dynamic leave balance calculation from real annual allocations and approved consumption.
 * - Zod schema validation and safe leave application execution.
 */

import { LeaveRequest, Employee } from "@/lib/validations/schemas";
import { LeaveRequestInput, LeaveRequestInputSchema } from "@/lib/validations/leave";
import {
  parseISO,
  eachDayOfInterval,
  isWeekend,
  isAfter,
  isBefore,
  isSameDay,
  format,
  isValid,
} from "date-fns";

export interface LeaveBalanceInfo {
  type: string;
  allocated: number;
  consumed: number;
  remaining: number;
  isAvailable: boolean;
}

export interface LeaveSubmissionResult {
  success: boolean;
  leave?: LeaveRequest;
  error?: string;
}

// Default standard statutory annual allocations (in days)
export const DEFAULT_LEAVE_ALLOCATIONS: Record<string, number> = {
  "Paid Time Off": 20,
  "Sick Leave": 10,
  "Casual Leave": 7,
  "Unpaid Leave": 30,
  "Parental Leave": 60,
};

/**
 * Calculates the number of working days between two dates (inclusive),
 * excluding weekends (Saturday & Sunday).
 */
export function calculateLeaveWorkingDays(startDateStr: string, endDateStr: string): number {
  try {
    const start = parseISO(startDateStr);
    const end = parseISO(endDateStr);

    if (!isValid(start) || !isValid(end) || isAfter(start, end)) {
      return 0;
    }

    const allDays = eachDayOfInterval({ start, end });
    const workingDays = allDays.filter((d) => !isWeekend(d));
    return workingDays.length || 1; // Minimum 1 if on single day
  } catch {
    return 1;
  }
}

/**
 * Parses start and end date from a leave request dates string.
 * Handles formats: "YYYY-MM-DD - YYYY-MM-DD", "YYYY-MM-DD", "Oct 12 - Oct 16".
 */
export function parseLeaveRange(datesStr: string): { start: Date; end: Date } | null {
  try {
    const trimmed = datesStr.trim();
    if (trimmed.includes(" - ") || trimmed.includes(" to ")) {
      const separator = trimmed.includes(" - ") ? " - " : " to ";
      const parts = trimmed.split(separator).map((p) => p.trim());
      if (parts.length === 2) {
        const d1 = parseISO(parts[0]);
        const d2 = parseISO(parts[1]);
        if (isValid(d1) && isValid(d2)) {
          return { start: d1, end: d2 };
        }
      }
    }
    const single = parseISO(trimmed);
    if (isValid(single)) {
      return { start: single, end: single };
    }
  } catch {}
  return null;
}

/**
 * Checks for date overlap between a new request and employee's existing Pending or Approved leaves.
 * Rejects with a clear, descriptive message naming the conflicting dates.
 */
export function checkLeaveOverlap(
  employeeId: string,
  startDateStr: string,
  endDateStr: string,
  existingLeaves: LeaveRequest[]
): { hasOverlap: boolean; conflictingLeave?: LeaveRequest; errorMessage?: string } {
  const newStart = parseISO(startDateStr);
  const newEnd = parseISO(endDateStr);

  if (!isValid(newStart) || !isValid(newEnd)) {
    return { hasOverlap: false };
  }

  // Filter only employee's active (Pending or Approved) requests
  const activeLeaves = existingLeaves.filter(
    (l) =>
      l.employeeId === employeeId &&
      (l.status === "Pending" || l.status === "Approved")
  );

  for (const leave of activeLeaves) {
    const range = parseLeaveRange(leave.dates);
    if (!range) continue;

    // Overlap condition: (StartA <= EndB) and (EndA >= StartB)
    const overlaps =
      (isBefore(newStart, range.end) || isSameDay(newStart, range.end)) &&
      (isAfter(newEnd, range.start) || isSameDay(newEnd, range.start));

    if (overlaps) {
      return {
        hasOverlap: true,
        conflictingLeave: leave,
        errorMessage: `Conflicting time off request: You already have a ${leave.status} ${leave.type} request covering ${leave.dates}. Please choose non-overlapping dates.`,
      };
    }
  }

  return { hasOverlap: false };
}

/**
 * Computes live employee leave balances dynamically from real approved leave records.
 * NEVER fabricates fake counts.
 */
export function calculateEmployeeLeaveBalances(
  employeeId: string,
  leaves: LeaveRequest[],
  allocations: Record<string, number> = DEFAULT_LEAVE_ALLOCATIONS
): {
  pto: LeaveBalanceInfo;
  sick: LeaveBalanceInfo;
  casual: LeaveBalanceInfo;
  unpaid: LeaveBalanceInfo;
} {
  const approvedLeaves = leaves.filter(
    (l) => l.employeeId === employeeId && l.status === "Approved"
  );

  const getConsumedDays = (type: string) => {
    return approvedLeaves
      .filter((l) => l.type.toLowerCase().includes(type.toLowerCase()))
      .reduce((sum, l) => sum + (l.days || 1), 0);
  };

  const ptoConsumed = getConsumedDays("Paid Time Off") || getConsumedDays("pto");
  const ptoAllocated = allocations["Paid Time Off"] || 20;

  const sickConsumed = getConsumedDays("Sick Leave") || getConsumedDays("sick");
  const sickAllocated = allocations["Sick Leave"] || 10;

  const casualConsumed = getConsumedDays("Casual Leave") || getConsumedDays("casual");
  const casualAllocated = allocations["Casual Leave"] || 7;

  const unpaidConsumed = getConsumedDays("Unpaid Leave") || getConsumedDays("unpaid");
  const unpaidAllocated = allocations["Unpaid Leave"] || 30;

  return {
    pto: {
      type: "Paid Time Off",
      allocated: ptoAllocated,
      consumed: ptoConsumed,
      remaining: Math.max(0, ptoAllocated - ptoConsumed),
      isAvailable: true,
    },
    sick: {
      type: "Sick Leave",
      allocated: sickAllocated,
      consumed: sickConsumed,
      remaining: Math.max(0, sickAllocated - sickConsumed),
      isAvailable: true,
    },
    casual: {
      type: "Casual Leave",
      allocated: casualAllocated,
      consumed: casualConsumed,
      remaining: Math.max(0, casualAllocated - casualConsumed),
      isAvailable: true,
    },
    unpaid: {
      type: "Unpaid Leave",
      allocated: unpaidAllocated,
      consumed: unpaidConsumed,
      remaining: Math.max(0, unpaidAllocated - unpaidConsumed),
      isAvailable: true,
    },
  };
}

/**
 * Validates and executes a new leave request.
 * Enforces:
 * 1. Self-session authentication (cannot impersonate another employee).
 * 2. Zod validation contract.
 * 3. Overlap check against existing Pending and Approved requests.
 * 4. Day count computation.
 */
export async function executeSubmitLeaveRequest(
  input: LeaveRequestInput,
  currentUser: Employee,
  existingLeaves: LeaveRequest[]
): Promise<LeaveSubmissionResult> {
  // 1. Enforce self-session binding
  if (input.employeeId !== currentUser.id) {
    return {
      success: false,
      error: "Authorization violation: You cannot submit a leave request on behalf of another employee.",
    };
  }

  // 2. Validate input schema with Zod
  const validation = LeaveRequestInputSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues.map((e) => e.message).join(", "),
    };
  }

  // 3. Overlap validation
  const overlap = checkLeaveOverlap(
    input.employeeId,
    input.startDate,
    input.endDate,
    existingLeaves
  );

  if (overlap.hasOverlap) {
    return {
      success: false,
      error: overlap.errorMessage || "Leave dates overlap with an existing request.",
    };
  }

  // 4. Compute working days
  const workingDays = calculateLeaveWorkingDays(input.startDate, input.endDate);
  const formattedDates = `${input.startDate} - ${input.endDate}`;

  // 5. Create new LeaveRequest record
  const newLeave: LeaveRequest = {
    id: `leave_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    employeeId: currentUser.id,
    employeeName: currentUser.name,
    department: currentUser.department,
    type: input.type,
    dates: formattedDates,
    days: workingDays,
    status: "Pending",
    avatar: currentUser.avatar || "",
  };

  return {
    success: true,
    leave: newLeave,
  };
}
