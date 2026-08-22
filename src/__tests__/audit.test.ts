import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { recordAuditEvent, filterAuditLogs } from "../services/auditService";
import { AuditLogEntry } from "../lib/types/audit";

describe("Audit Domain & Trail Recording Suite", () => {
  it("should validate and create a structured audit log entry", () => {
    const result = recordAuditEvent({
      category: "ATTENDANCE",
      action: "ATTENDANCE_CHECK_IN",
      description: "checked in at 09:15 AM",
      actorId: "emp_1",
      actorName: "Aarav Sharma",
      actorRole: "employee",
      targetEntity: "AttendanceLog",
      ipAddress: "192.168.1.5",
    });

    assert.equal(result.success, true);
    assert.equal(result.entry?.category, "ATTENDANCE");
    assert.equal(result.entry?.actorName, "Aarav Sharma");
    assert.equal(result.entry?.ipAddress, "192.168.1.5");
  });

  it("should filter audit logs by category and actor name", () => {
    const logs: AuditLogEntry[] = [
      {
        id: "a1",
        category: "ATTENDANCE",
        action: "ATTENDANCE_CHECK_IN",
        description: "checked in",
        actorName: "Aarav Sharma",
        timestamp: "2026-08-22T09:00:00Z",
      },
      {
        id: "a2",
        category: "LEAVE",
        action: "LEAVE_APPROVED",
        description: "approved sick leave for Aarav",
        actorName: "HR Admin",
        timestamp: "2026-08-22T10:00:00Z",
      },
      {
        id: "a3",
        category: "PAYROLL",
        action: "PAYSLIP_GENERATED",
        description: "generated August payslip",
        actorName: "HR Admin",
        timestamp: "2026-08-22T11:00:00Z",
      },
    ];

    const leaveLogs = filterAuditLogs(logs, { category: "LEAVE" });
    assert.equal(leaveLogs.totalCount, 1);
    assert.equal(leaveLogs.records[0].action, "LEAVE_APPROVED");

    const hrLogs = filterAuditLogs(logs, { actorName: "HR Admin" });
    assert.equal(hrLogs.totalCount, 2);
  });
});
