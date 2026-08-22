import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  deriveDailyAttendanceStatus,
  calculateEmployeeAttendanceSummary,
  executeCheckIn,
  executeCheckOut,
} from "../services/attendanceService";
import { getHRAttendanceData } from "../actions/attendanceActions";
import { AttendanceLog, LeaveRequest } from "../lib/validations/schemas";
import { computeWorkedDuration } from "../lib/dateUtils";

describe("Attendance Business Logic & Security Suite", () => {
  // 1. LEAVE PRECEDENCE
  it("should prioritize approved leave over attendance record on the same day", () => {
    const testDate = new Date("2026-08-20T10:00:00Z");
    const record: AttendanceLog = {
      id: "a1",
      employeeId: "emp_1",
      employeeName: "Aarav Sharma",
      date: "2026-08-20",
      checkIn: "09:00 AM",
      checkOut: "05:00 PM",
      workHours: "8h 00m",
      extraHours: "-",
      status: "Present",
    };
    const approvedLeave: LeaveRequest = {
      id: "l1",
      employeeId: "emp_1",
      employeeName: "Aarav Sharma",
      department: "Engineering",
      type: "Sick Leave",
      dates: "2026-08-20",
      days: 1,
      status: "Approved",
      avatar: "",
    };

    const derived = deriveDailyAttendanceStatus(testDate, record, [approvedLeave]);
    assert.equal(derived.status, "Leave", "Approved leave must override attendance");
  });

  // 2. HALF-DAY THRESHOLD (< 4.5 HOURS)
  it("should mark worked duration under 4.5 hours as Half-day", () => {
    const testDate = new Date("2026-08-19T10:00:00Z");
    const record: AttendanceLog = {
      id: "a2",
      employeeId: "emp_1",
      employeeName: "Aarav Sharma",
      date: "2026-08-19",
      checkIn: "09:00 AM",
      checkOut: "01:00 PM",
      workHours: "4h 00m",
      extraHours: "-",
      status: "Present",
    };

    const derived = deriveDailyAttendanceStatus(testDate, record, []);
    assert.equal(derived.status, "Half-day", "Worked duration < 4.5h must be Half-day");
  });

  // 3. FULL SHIFT PRESENT (>= 4.5 HOURS)
  it("should mark worked duration >= 4.5 hours as Present", () => {
    const testDate = new Date("2026-08-18T10:00:00Z");
    const record: AttendanceLog = {
      id: "a3",
      employeeId: "emp_1",
      employeeName: "Aarav Sharma",
      date: "2026-08-18",
      checkIn: "09:00 AM",
      checkOut: "05:30 PM",
      workHours: "8h 30m",
      extraHours: "0h 30m",
      status: "Present",
    };

    const derived = deriveDailyAttendanceStatus(testDate, record, []);
    assert.equal(derived.status, "Present");
  });

  // 4. ABSENT ON UNATTENDED PAST WORKING DAYS
  it("should mark unattended past working day as Absent", () => {
    const testPastWeekday = new Date("2026-08-17T10:00:00Z"); // Monday
    const derived = deriveDailyAttendanceStatus(testPastWeekday, null, []);
    assert.equal(derived.status, "Absent", "Past unattended working day must be Absent");
  });

  // 5. WEEKEND EXCLUSION
  it("should mark Saturday and Sunday as Weekend, not Absent", () => {
    const testSaturday = new Date("2026-08-15T10:00:00Z"); // Saturday
    const testSunday = new Date("2026-08-16T10:00:00Z"); // Sunday

    const derivedSat = deriveDailyAttendanceStatus(testSaturday, null, []);
    const derivedSun = deriveDailyAttendanceStatus(testSunday, null, []);

    assert.equal(derivedSat.status, "Weekend");
    assert.equal(derivedSun.status, "Weekend");
  });

  // 6. SAFE DURATION & EXTRA HOURS CALCULATION
  it("should safely compute worked duration and overtime extra hours", () => {
    const res = computeWorkedDuration("09:00 AM", "06:30 PM", 0);
    assert.equal(res.workHours, "9h 30m");
    assert.equal(res.extraHours, "1h 30m");
    assert.equal(res.totalHoursNumeric, 9.5);
  });

  // 7. DUPLICATE CHECK-IN BLOCKING
  it("should block a duplicate open check-in for the same employee on the same date", async () => {
    const existingLog: AttendanceLog = {
      id: "att_today",
      employeeId: "emp_test",
      employeeName: "Test Employee",
      date: new Date().toISOString().split("T")[0],
      checkIn: "09:15 AM",
      checkOut: "--:--",
      workHours: "--",
      extraHours: "-",
      status: "Present",
    };

    const result = await executeCheckIn(
      { employeeId: "emp_test", workMode: "office" },
      "Test Employee",
      [existingLog]
    );

    assert.equal(result.success, false);
    assert.match(result.error || "", /Duplicate check-in blocked/);
  });

  // 8. CRITICAL SERVER-SIDE SECURITY: HR DATA ACCESS GUARD
  it("should reject an Employee role from accessing HR attendance data on the server", async () => {
    const response = await getHRAttendanceData({
      userRole: "employee",
      date: "2026-08-22",
    });

    assert.equal(response.success, false);
    assert.equal(response.records.length, 0, "No records must be returned to an employee");
    assert.match(response.error || "", /403 Forbidden/);
  });

  it("should permit Admin and HR roles to access HR attendance data on the server", async () => {
    const responseAdmin = await getHRAttendanceData({
      userRole: "admin",
      date: "2026-08-22",
    });

    const responseHR = await getHRAttendanceData({
      userRole: "hr",
      date: "2026-08-22",
    });

    assert.equal(responseAdmin.success, true);
    assert.equal(responseHR.success, true);
  });
});
