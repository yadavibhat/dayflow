import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateLeaveWorkingDays,
  checkLeaveOverlap,
  calculateEmployeeLeaveBalances,
  executeSubmitLeaveRequest,
} from "../services/leaveService";
import { LeaveRequest, Employee } from "../lib/validations/schemas";

describe("Leave Application & Time Off Domain Suite", () => {
  const dummyEmployee: Employee = {
    id: "emp_1",
    name: "Aarav Sharma",
    role: "Senior Software Engineer",
    department: "Engineering",
    status: "Active",
    avatar: "",
    email: "aarav.sharma@company.in",
    phone: "+91 98765 43210",
    dob: "August 15, 1995",
    nationality: "Indian",
    maritalStatus: "Single",
    address: "Bengaluru",
    doj: "March 01, 2021",
    bankName: "SBI",
    accountNo: "5678",
    routingNo: "SBIN0000123",
    panTaxId: "ABCPS1234Z",
    uan: "100982736451",
    salary: {
      base: 1200000,
      basicPct: 50,
      hraPct: 25,
      stdPct: 10,
      pfPct: 12,
      ptFixed: 200,
    },
  };

  // 1. WORKING DAYS CALCULATION
  it("should calculate working days between Monday and Friday (5 days)", () => {
    // 2026-08-17 is Monday, 2026-08-21 is Friday
    const days = calculateLeaveWorkingDays("2026-08-17", "2026-08-21");
    assert.equal(days, 5);
  });

  it("should exclude Saturday and Sunday from leave working days count", () => {
    // 2026-08-14 (Friday) to 2026-08-17 (Monday) includes Sat/Sun
    const days = calculateLeaveWorkingDays("2026-08-14", "2026-08-17");
    assert.equal(days, 2, "Friday + Monday = 2 working days");
  });

  // 2. OVERLAP DETECTION
  it("should detect overlapping dates against existing Approved or Pending leave", () => {
    const existing: LeaveRequest[] = [
      {
        id: "l_1",
        employeeId: "emp_1",
        employeeName: "Aarav Sharma",
        department: "Engineering",
        type: "Paid Time Off",
        dates: "2026-08-20 - 2026-08-25",
        days: 4,
        status: "Approved",
        avatar: "",
      },
    ];

    const result = checkLeaveOverlap("emp_1", "2026-08-22", "2026-08-28", existing);
    assert.equal(result.hasOverlap, true);
    assert.match(result.errorMessage || "", /Conflicting time off request/);
  });

  it("should allow non-overlapping dates", () => {
    const existing: LeaveRequest[] = [
      {
        id: "l_1",
        employeeId: "emp_1",
        employeeName: "Aarav Sharma",
        department: "Engineering",
        type: "Paid Time Off",
        dates: "2026-08-10 - 2026-08-15",
        days: 5,
        status: "Approved",
        avatar: "",
      },
    ];

    const result = checkLeaveOverlap("emp_1", "2026-08-20", "2026-08-25", existing);
    assert.equal(result.hasOverlap, false);
  });

  // 3. BALANCE DYNAMIC COMPUTATION
  it("should dynamically calculate remaining leave balances from approved requests", () => {
    const existing: LeaveRequest[] = [
      {
        id: "l_1",
        employeeId: "emp_1",
        employeeName: "Aarav Sharma",
        department: "Engineering",
        type: "Paid Time Off",
        dates: "2026-08-01 - 2026-08-05",
        days: 4,
        status: "Approved",
        avatar: "",
      },
      {
        id: "l_2",
        employeeId: "emp_1",
        employeeName: "Aarav Sharma",
        department: "Engineering",
        type: "Sick Leave",
        dates: "2026-08-10 - 2026-08-11",
        days: 2,
        status: "Approved",
        avatar: "",
      },
    ];

    const balances = calculateEmployeeLeaveBalances("emp_1", existing);
    // PTO: 20 allocated - 4 consumed = 16 remaining
    assert.equal(balances.pto.allocated, 20);
    assert.equal(balances.pto.consumed, 4);
    assert.equal(balances.pto.remaining, 16);

    // Sick: 10 allocated - 2 consumed = 8 remaining
    assert.equal(balances.sick.allocated, 10);
    assert.equal(balances.sick.consumed, 2);
    assert.equal(balances.sick.remaining, 8);
  });

  // 4. LEAVE SUBMISSION & SECURITY
  it("should prevent submitting leave on behalf of another employee", async () => {
    const result = await executeSubmitLeaveRequest(
      {
        employeeId: "emp_2", // Different ID
        type: "Paid Time Off",
        startDate: "2026-09-01",
        endDate: "2026-09-03",
        reason: "Family vacation",
      },
      dummyEmployee,
      []
    );

    assert.equal(result.success, false);
    assert.match(result.error || "", /Authorization violation/);
  });

  it("should submit a valid leave request and mark as Pending", async () => {
    const result = await executeSubmitLeaveRequest(
      {
        employeeId: "emp_1",
        type: "Paid Time Off",
        startDate: "2026-09-01",
        endDate: "2026-09-03",
        reason: "Family vacation",
      },
      dummyEmployee,
      []
    );

    assert.equal(result.success, true);
    assert.equal(result.leave?.status, "Pending");
    assert.equal(result.leave?.employeeId, "emp_1");
  });
});
