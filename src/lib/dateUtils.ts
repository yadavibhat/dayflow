/**
 * Centralized Date, Time, and Timezone Utilities for Dayflow HRMS
 * Ensures consistent 'today' date boundary and duration calculations across all components.
 */

import { format, parseISO, isWithinInterval, startOfDay, endOfDay, isValid, differenceInMinutes } from "date-fns";

/**
 * Returns today's date formatted as YYYY-MM-DD in the local/client timezone.
 */
export function getTodayDateString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Returns the current time formatted as hh:mm a (e.g., "09:15 AM").
 */
export function getCurrentTimeString(): string {
  return format(new Date(), "hh:mm a");
}

/**
 * Formats an ISO string or Date into readable time (e.g., "09:30 AM").
 */
export function formatTimeDisplay(dateInput?: string | Date | null): string {
  if (!dateInput || dateInput === "--:--" || dateInput === "-") return "--:--";
  try {
    // If it's already in "09:30 AM" format
    if (typeof dateInput === "string" && /^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(dateInput.trim())) {
      return dateInput.trim();
    }
    const d = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
    return isValid(d) ? format(d, "hh:mm a") : String(dateInput);
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats an ISO string or Date into readable date (e.g., "22 Aug 2026").
 */
export function formatDateDisplay(dateInput?: string | Date | null, formatStr = "dd MMM yyyy"): string {
  if (!dateInput) return "—";
  try {
    const d = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
    return isValid(d) ? format(d, formatStr) : String(dateInput);
  } catch {
    return String(dateInput);
  }
}

/**
 * Computes worked duration between check-in and check-out timestamps.
 * Standard shift: 8 hours (480 mins). Extra hours = worked mins - 480 mins.
 */
export function computeWorkedDuration(
  checkInInput?: string | Date | null,
  checkOutInput?: string | Date | null,
  breakMinutes = 0
): { workHours: string; extraHours: string; totalHoursNumeric: number } {
  if (!checkInInput || !checkOutInput || checkInInput === "--:--" || checkOutInput === "--:--") {
    return { workHours: "--", extraHours: "-", totalHoursNumeric: 0 };
  }

  try {
    let inDate: Date;
    let outDate: Date;

    if (typeof checkInInput === "string" && !checkInInput.includes("T")) {
      // Time string like "09:00 AM"
      const today = getTodayDateString();
      inDate = new Date(`${today} ${checkInInput}`);
    } else {
      inDate = typeof checkInInput === "string" ? parseISO(checkInInput) : checkInInput;
    }

    if (typeof checkOutInput === "string" && !checkOutInput.includes("T")) {
      const today = getTodayDateString();
      outDate = new Date(`${today} ${checkOutInput}`);
    } else {
      outDate = typeof checkOutInput === "string" ? parseISO(checkOutInput) : checkOutInput;
    }

    if (!isValid(inDate) || !isValid(outDate) || outDate < inDate) {
      return { workHours: "--", extraHours: "-", totalHoursNumeric: 0 };
    }

    const rawDiffMins = Math.max(0, differenceInMinutes(outDate, inDate) - breakMinutes);
    const hours = Math.floor(rawDiffMins / 60);
    const mins = rawDiffMins % 60;
    const totalHoursNumeric = Math.round((rawDiffMins / 60) * 100) / 100;
    const workHours = `${hours}h ${mins}m`;

    // Calculate overtime / extra hours (if > 8h / 480m)
    let extraHours = "-";
    if (rawDiffMins > 480) {
      const extraMinsTotal = rawDiffMins - 480;
      const extraH = Math.floor(extraMinsTotal / 60);
      const extraM = extraMinsTotal % 60;
      extraHours = `${extraH}h ${extraM}m`;
    }

    return { workHours, extraHours, totalHoursNumeric };
  } catch {
    return { workHours: "--", extraHours: "-", totalHoursNumeric: 0 };
  }
}

/**
 * Checks if a given date is within a leave date interval.
 */
export function isDateInLeaveRange(targetDateStr: string, startDateStr: string, endDateStr: string): boolean {
  try {
    const target = parseISO(targetDateStr);
    const start = startOfDay(parseISO(startDateStr));
    const end = endOfDay(parseISO(endDateStr));
    return isWithinInterval(target, { start, end });
  } catch {
    return false;
  }
}
