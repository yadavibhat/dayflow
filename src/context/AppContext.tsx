"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  serverCheckIn as srvCheckIn,
  serverCheckOut as srvCheckOut,
  serverUpdateLeaveStatus as srvUpdateLeave,
} from "@/lib/services/dashboard";
import {
  employeeSchema,
  leaveRequestSchema,
  salaryProfileSchema,
  Employee,
  SalaryProfile,
  AttendanceLog,
  LeaveRequest,
  AuditLog,
} from "@/lib/validations/schemas";
export type {
  Employee,
  SalaryProfile,
  AttendanceLog,
  LeaveRequest,
  AuditLog,
};

interface AppContextType {
  currentRole: "admin" | "employee";
  setRole: (role: "admin" | "employee") => void;
  currentUser: Employee;
  employees: Employee[];
  attendance: AttendanceLog[];
  leaves: LeaveRequest[];
  auditLogs: AuditLog[];
  checkIn: (employeeId: string) => void;
  checkOut: (employeeId: string) => void;
  addEmployee: (employee: Omit<Employee, "id" | "salary"> & { baseSalary: number }) => void;
  requestLeave: (leave: Omit<LeaveRequest, "id" | "status" | "employeeName" | "department" | "avatar">) => void;
  updateLeaveStatus: (leaveId: string, status: "Approved" | "Rejected") => void;
  updateSalaryProfile: (employeeId: string, salary: SalaryProfile) => void;
  addAuditLog: (action: string, user: string) => void;
}

const initialEmployees: Employee[] = [
  {
    id: "1",
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
    address: "42, Residency Road, Bengaluru, Karnataka 560025",
    doj: "March 01, 2021",
    bankName: "State Bank of India",
    accountNo: "•••• •••• •••• 5678",
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
  },
];

const initialAttendance: AttendanceLog[] = [];

const initialLeaves: LeaveRequest[] = [];

const initialAuditLogs: AuditLog[] = [
  {
    id: "log1",
    user: "System",
    action: "HRMS application initialized successfully",
    timestamp: "Just now",
    ipAddress: "127.0.0.1",
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper check to identify if actual credentials are setup in environment
const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return (
    url !== undefined &&
    key !== undefined &&
    url !== "" &&
    key !== "" &&
    !url.includes("your-project-id") &&
    !key.includes("your-supabase-anon-key")
  );
};

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentRole, setRole] = useState<"admin" | "employee">("admin");
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [attendance, setAttendance] = useState<AttendanceLog[]>(initialAttendance);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(initialLeaves);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);

  // Load from localStorage or Supabase on mount
  useEffect(() => {
    if (isSupabaseConfigured()) {
      const fetchSupabaseData = async () => {
        try {
          const { data: emps } = await supabase.from("employees").select("*");
          if (emps && emps.length > 0) setEmployees(emps as Employee[]);

          const { data: atts } = await supabase.from("attendance").select("*");
          if (atts && atts.length > 0) setAttendance(atts as AttendanceLog[]);

          const { data: lvs } = await supabase.from("leaves").select("*");
          if (lvs && lvs.length > 0) setLeaves(lvs as LeaveRequest[]);

          const { data: logs } = await supabase
            .from("audit_logs")
            .select("*")
            .order("created_at", { ascending: false });
          if (logs && logs.length > 0) setAuditLogs(logs as AuditLog[]);
        } catch (e) {
          console.error("Supabase fetch error, fallback to localState", e);
        }
      };
      fetchSupabaseData();
    } else {
      const localRole = localStorage.getItem("dayflow_role");
      const localEmployees = localStorage.getItem("dayflow_employees");
      const localAttendance = localStorage.getItem("dayflow_attendance");
      const localLeaves = localStorage.getItem("dayflow_leaves");
      const localLogs = localStorage.getItem("dayflow_logs");

      if (localRole) setRole(localRole as "admin" | "employee");
      if (localEmployees) setEmployees(JSON.parse(localEmployees));
      if (localAttendance) setAttendance(JSON.parse(localAttendance));
      if (localLeaves) setLeaves(JSON.parse(localLeaves));
      if (localLogs) setAuditLogs(JSON.parse(localLogs));
    }
  }, []);

  const saveState = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const handleSetRole = (role: "admin" | "employee") => {
    setRole(role);
    localStorage.setItem("dayflow_role", role);
  };

  const addAuditLog = async (action: string, user: string) => {
    const newLog: AuditLog = {
      id: `log${Date.now()}`,
      user,
      action,
      timestamp: "Just now",
      ipAddress: "127.0.0.1",
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("audit_logs").insert([newLog]);
      } catch (err) {
        console.error(err);
      }
    }

    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    saveState("dayflow_logs", updated);
  };

  const checkIn = async (employeeId: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const isAlreadyCheckedIn = attendance.some(
      (a) => a.employeeId === employeeId && a.date === todayStr
    );

    if (isAlreadyCheckedIn) return;

    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const padMin = String(minutes).padStart(2, "0");
    const checkInTime = `${String(displayHours).padStart(2, "0")}:${padMin} ${ampm}`;

    const isLate = hours > 9 || (hours === 9 && minutes > 0);

    const newRecord: AttendanceLog = {
      id: `att${Date.now()}`,
      employeeId,
      employeeName: emp.name,
      checkIn: checkInTime,
      checkOut: "--:--",
      workHours: "--",
      extraHours: "-",
      status: isLate ? "Late" : "Present",
      date: todayStr,
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("attendance").insert([newRecord]);
        await supabase.from("employees").update({ status: "Active" }).eq("id", employeeId);
      } catch (err) {
        console.error(err);
      }
    }

    const updated = [newRecord, ...attendance];
    setAttendance(updated);
    saveState("dayflow_attendance", updated);

    const updatedEmployees = employees.map((e) =>
      e.id === employeeId ? { ...e, status: "Active" as const } : e
    );
    setEmployees(updatedEmployees);
    saveState("dayflow_employees", updatedEmployees);

    // Trigger server-side revalidation (non-blocking)
    srvCheckIn(employeeId, emp.name).catch(() => null);

    addAuditLog(`checked in at ${checkInTime}`, emp.name);
  };

  const checkOut = async (employeeId: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const recordIndex = attendance.findIndex(
      (a) => a.employeeId === employeeId && a.date === todayStr
    );

    if (recordIndex === -1) return;

    const record = attendance[recordIndex];
    if (record.checkOut !== "--:--") return;

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const padMin = String(minutes).padStart(2, "0");
    const checkOutTime = `${String(displayHours).padStart(2, "0")}:${padMin} ${ampm}`;

    const checkInParts = record.checkIn.split(" ");
    const timeParts = checkInParts[0].split(":");
    let inHrs = parseInt(timeParts[0]);
    const inMins = parseInt(timeParts[1]);
    const inAmpm = checkInParts[1];

    if (inAmpm === "PM" && inHrs !== 12) inHrs += 12;
    if (inAmpm === "AM" && inHrs === 12) inHrs = 0;

    const checkInDate = new Date();
    checkInDate.setHours(inHrs, inMins, 0);

    const diffMs = now.getTime() - checkInDate.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    const totalHoursStr = `${diffHrs}h ${diffMins}m`;

    let extraHoursStr = "-";
    if (diffMs > 8 * 60 * 60 * 1000) {
      const extraMs = diffMs - 8 * 60 * 60 * 1000;
      const exHrs = Math.floor(extraMs / (1000 * 60 * 60));
      const exMins = Math.floor((extraMs % (1000 * 60 * 60)) / (1000 * 60));
      extraHoursStr = `${exHrs}h ${exMins}m`;
    }

    const updatedRecord: AttendanceLog = {
      ...record,
      checkOut: checkOutTime,
      workHours: totalHoursStr,
      extraHours: extraHoursStr,
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("attendance")
          .update({ checkOut: checkOutTime, workHours: totalHoursStr, extraHours: extraHoursStr })
          .eq("id", record.id);
        await supabase.from("employees").update({ status: "Away" }).eq("id", employeeId);
      } catch (err) {
        console.error(err);
      }
    }

    const updatedAttendance = [...attendance];
    updatedAttendance[recordIndex] = updatedRecord;
    setAttendance(updatedAttendance);
    saveState("dayflow_attendance", updatedAttendance);

    const updatedEmployees = employees.map((e) =>
      e.id === employeeId ? { ...e, status: "Away" as const } : e
    );
    setEmployees(updatedEmployees);
    saveState("dayflow_employees", updatedEmployees);

    // Trigger server-side revalidation (non-blocking)
    const empName = employees.find((e) => e.id === employeeId)?.name ?? employeeId;
    srvCheckOut(employeeId, empName).catch(() => null);

    addAuditLog(`checked out at ${checkOutTime} (${totalHoursStr} worked)`, record.employeeName);
  };

  const addEmployee = async (employee: Omit<Employee, "id" | "salary"> & { baseSalary: number }) => {
    const newId = String(employees.length + 1);
    const newEmp: Employee = {
      ...employee,
      id: newId,
      salary: {
        base: employee.baseSalary,
        basicPct: 50,
        hraPct: 25,
        stdPct: 10,
        pfPct: 12,
        ptFixed: 200,
      },
    };

    // Zod validation contract enforcement
    const validated = employeeSchema.safeParse(newEmp);
    if (!validated.success) {
      const errorMsg = validated.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      alert(`Schema Validation Failed: ${errorMsg}`);
      console.error("Zod Schema Validation Failed", validated.error.format());
      return;
    }

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from("employees").insert([validated.data]);
        if (error) throw error;
      } catch (err) {
        console.error("Supabase insert failed, falling back to localState", err);
      }
    }

    const updated = [...employees, validated.data];
    setEmployees(updated);
    saveState("dayflow_employees", updated);

    addAuditLog(`created profile for new employee ${employee.name}`, "HR Admin");
  };

  const requestLeave = async (leave: Omit<LeaveRequest, "id" | "status" | "employeeName" | "department" | "avatar">) => {
    const emp = employees.find((e) => e.id === leave.employeeId);
    if (!emp) return;

    const newRequest: LeaveRequest = {
      ...leave,
      id: `l${Date.now()}`,
      employeeName: emp.name,
      department: emp.department,
      status: "Pending",
      avatar: emp.avatar,
    };

    // Zod validation contract enforcement
    const validated = leaveRequestSchema.safeParse(newRequest);
    if (!validated.success) {
      const errorMsg = validated.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      alert(`Schema Validation Failed: ${errorMsg}`);
      console.error("Zod Schema Validation Failed", validated.error.format());
      return;
    }

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from("leaves").insert([validated.data]);
        if (error) throw error;
      } catch (err) {
        console.error("Supabase insert failed, falling back to localState", err);
      }
    }

    const updated = [validated.data, ...leaves];
    setLeaves(updated);
    saveState("dayflow_leaves", updated);

    addAuditLog(`submitted a request for ${leave.type} (${leave.dates})`, emp.name);
  };

  const updateLeaveStatus = async (leaveId: string, status: "Approved" | "Rejected") => {
    const updatedLeaves = leaves.map((l) =>
      l.id === leaveId ? { ...l, status } : l
    );

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("leaves").update({ status }).eq("id", leaveId);
      } catch (err) {
        console.error(err);
      }
    }

    setLeaves(updatedLeaves);
    saveState("dayflow_leaves", updatedLeaves);

    const leave = leaves.find((l) => l.id === leaveId);
    if (leave) {
      addAuditLog(`${status.toLowerCase()} leave request for ${leave.employeeName}`, "HR Admin");
      // Trigger server-side revalidation (non-blocking)
      srvUpdateLeave(leaveId, status, "HR Admin").catch(() => null);

      if (status === "Approved") {
        const todayStr = new Date().toISOString().split("T")[0];
        const newRecord: AttendanceLog = {
          id: `att${Date.now()}`,
          employeeId: leave.employeeId,
          employeeName: leave.employeeName,
          checkIn: "--:--",
          checkOut: "--:--",
          workHours: "--",
          extraHours: "-",
          status: "On Leave",
          date: todayStr,
        };

        if (isSupabaseConfigured()) {
          try {
            await supabase.from("attendance").insert([newRecord]);
            await supabase.from("employees").update({ status: "On Leave" }).eq("id", leave.employeeId);
          } catch (err) {
            console.error(err);
          }
        }

        const updatedAttendance = [newRecord, ...attendance];
        setAttendance(updatedAttendance);
        saveState("dayflow_attendance", updatedAttendance);

        const updatedEmployees = employees.map((e) =>
          e.id === leave.employeeId ? { ...e, status: "On Leave" as const } : e
        );
        setEmployees(updatedEmployees);
        saveState("dayflow_employees", updatedEmployees);
      }
    }
  };

  const updateSalaryProfile = async (employeeId: string, salary: SalaryProfile) => {
    // Validate salary sub-schema contract
    const validatedSalary = salaryProfileSchema.safeParse(salary);
    if (!validatedSalary.success) {
      const errorMsg = validatedSalary.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      alert(`Schema Validation Failed: ${errorMsg}`);
      console.error("Zod Schema Validation Failed", validatedSalary.error.format());
      return;
    }

    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    const updatedEmp: Employee = {
      ...emp,
      salary: validatedSalary.data,
    };

    // Validate full employee schema contract
    const validatedEmp = employeeSchema.safeParse(updatedEmp);
    if (!validatedEmp.success) {
      const errorMsg = validatedEmp.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      alert(`Schema Validation Failed: ${errorMsg}`);
      console.error("Zod Schema Validation Failed", validatedEmp.error.format());
      return;
    }

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from("employees")
          .update({ salary: validatedSalary.data })
          .eq("id", employeeId);
        if (error) throw error;
      } catch (err) {
        console.error("Supabase update failed, falling back to localState", err);
      }
    }

    const updatedEmployees = employees.map((e) =>
      e.id === employeeId ? validatedEmp.data : e
    );
    setEmployees(updatedEmployees);
    saveState("dayflow_employees", updatedEmployees);
    addAuditLog(`updated payroll salary components for ${emp.name}`, "HR Admin");
  };

  const currentUser = employees.find((e) => e.id === "1") || initialEmployees[0];

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setRole: handleSetRole,
        currentUser,
        employees,
        attendance,
        leaves,
        auditLogs,
        checkIn,
        checkOut,
        addEmployee,
        requestLeave,
        updateLeaveStatus,
        updateSalaryProfile,
        addAuditLog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppContextProvider");
  }
  return context;
};
