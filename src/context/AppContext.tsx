"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { executeCheckIn, executeCheckOut } from "@/services/attendanceService";
import { serverUpdateLeaveStatus as srvUpdateLeave } from "@/lib/services/dashboard";
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
  checkIn: (employeeId: string) => Promise<void>;
  checkOut: (employeeId: string) => Promise<void>;
  addEmployee: (employee: Omit<Employee, "id" | "salary"> & { baseSalary: number }) => Promise<void>;
  requestLeave: (leave: Omit<LeaveRequest, "id" | "status" | "employeeName" | "department" | "avatar">) => Promise<void>;
  updateLeaveStatus: (leaveId: string, status: "Approved" | "Rejected") => Promise<void>;
  updateSalaryProfile: (employeeId: string, salary: SalaryProfile) => Promise<void>;
  addAuditLog: (action: string, user: string) => void;
  refreshData: () => Promise<void>;
}

const initialEmployees: Employee[] = [
  {
    id: "1",
    name: "Mahi Soni",
    role: "HR Operations Lead",
    department: "HR",
    status: "Active",
    avatar: "",
    email: "mahi.soni@dayflow.in",
    phone: "+91 98234 56789",
    dob: "June 12, 1996",
    nationality: "Indian",
    maritalStatus: "Single",
    address: "18, Indiranagar 100ft Road, Bengaluru, Karnataka 560038",
    doj: "January 15, 2021",
    bankName: "HDFC Bank",
    accountNo: "•••• •••• •••• 4321",
    routingNo: "HDFC0001234",
    panTaxId: "MAHPS5432X",
    uan: "100982736450",
    salary: {
      base: 1500000,
      basicPct: 50,
      hraPct: 25,
      stdPct: 15,
      pfPct: 12,
      ptFixed: 200,
    },
  },
  {
    id: "2",
    name: "Aarav Sharma",
    role: "Senior Software Engineer",
    department: "Engineering",
    status: "Active",
    avatar: "",
    email: "aarav.sharma@dayflow.in",
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
      stdPct: 15,
      pfPct: 12,
      ptFixed: 200,
    },
  },
  {
    id: "3",
    name: "Priya Patel",
    role: "Senior Product Designer",
    department: "Design",
    status: "Active",
    avatar: "",
    email: "priya.patel@dayflow.in",
    phone: "+91 98111 22334",
    dob: "November 20, 1997",
    nationality: "Indian",
    maritalStatus: "Single",
    address: "7th Sector, HSR Layout, Bengaluru, Karnataka 560102",
    doj: "July 10, 2022",
    bankName: "ICICI Bank",
    accountNo: "•••• •••• •••• 9876",
    routingNo: "ICIC0000987",
    panTaxId: "PRIYP8765K",
    uan: "100982736452",
    salary: {
      base: 1050000,
      basicPct: 50,
      hraPct: 25,
      stdPct: 15,
      pfPct: 12,
      ptFixed: 200,
    },
  },
  {
    id: "4",
    name: "Rohan Mehta",
    role: "Full Stack Developer",
    department: "Engineering",
    status: "Away",
    avatar: "",
    email: "rohan.mehta@dayflow.in",
    phone: "+91 98450 11223",
    dob: "April 05, 1998",
    nationality: "Indian",
    maritalStatus: "Single",
    address: "Koramangala 4th Block, Bengaluru, Karnataka 560034",
    doj: "January 09, 2023",
    bankName: "Axis Bank",
    accountNo: "•••• •••• •••• 6543",
    routingNo: "UTIB0000456",
    panTaxId: "ROHPM4321M",
    uan: "100982736453",
    salary: {
      base: 950000,
      basicPct: 50,
      hraPct: 25,
      stdPct: 15,
      pfPct: 12,
      ptFixed: 200,
    },
  },
  {
    id: "5",
    name: "Ananya Iyer",
    role: "Financial Analyst",
    department: "Finance",
    status: "Active",
    avatar: "",
    email: "ananya.iyer@dayflow.in",
    phone: "+91 98333 44556",
    dob: "September 18, 1996",
    nationality: "Indian",
    maritalStatus: "Single",
    address: "Jayanagar 9th Block, Bengaluru, Karnataka 560069",
    doj: "May 15, 2022",
    bankName: "Kotak Mahindra Bank",
    accountNo: "•••• •••• •••• 3210",
    routingNo: "KKBK0000123",
    panTaxId: "ANAYI3210P",
    uan: "100982736454",
    salary: {
      base: 850000,
      basicPct: 50,
      hraPct: 25,
      stdPct: 15,
      pfPct: 12,
      ptFixed: 200,
    },
  },
];

const initialAttendance: AttendanceLog[] = [];

const initialLeaves: LeaveRequest[] = [
  {
    id: "l_init_1",
    employeeId: "2",
    employeeName: "Aarav Sharma",
    department: "Engineering",
    type: "Paid Time Off",
    dates: "2026-09-07 - 2026-09-09",
    days: 3,
    status: "Pending",
    avatar: "",
  },
  {
    id: "l_init_2",
    employeeId: "3",
    employeeName: "Priya Patel",
    department: "Design",
    type: "Sick Leave",
    dates: "2026-08-18 - 2026-08-19",
    days: 2,
    status: "Approved",
    avatar: "",
  },
  {
    id: "l_init_3",
    employeeId: "4",
    employeeName: "Rohan Mehta",
    department: "Engineering",
    type: "Casual Leave",
    dates: "2026-08-11 - 2026-08-12",
    days: 2,
    status: "Rejected",
    avatar: "",
  },
];

const initialAuditLogs: AuditLog[] = [
  {
    id: "log1",
    user: "Mahi Soni",
    action: "approved Sick Leave for Priya Patel (2026-08-18 - 2026-08-19)",
    timestamp: "10 mins ago",
    ipAddress: "192.168.1.10",
  },
  {
    id: "log2",
    user: "Aarav Sharma",
    action: "submitted Paid Time Off request (2026-09-07 - 2026-09-09)",
    timestamp: "25 mins ago",
    ipAddress: "192.168.1.14",
  },
  {
    id: "log3",
    user: "System",
    action: "HRMS application initialized successfully in INR (₹)",
    timestamp: "1 hour ago",
    ipAddress: "127.0.0.1",
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper check to identify if actual credentials are setup in environment
export const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return (
    url !== undefined &&
    key !== undefined &&
    url !== "" &&
    key !== "" &&
    !url.includes("your-placeholder-url") &&
    !key.includes("your-placeholder-anon-key") &&
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

  const fetchSupabaseData = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const [empRes, attRes, leaveRes] = await Promise.all([
        supabase.from("employees").select("*"),
        supabase.from("attendance").select("*"),
        supabase.from("leaves").select("*"),
      ]);

      if (empRes.data && empRes.data.length > 0) setEmployees(empRes.data);
      if (attRes.data) setAttendance(attRes.data);
      if (leaveRes.data) setLeaves(leaveRes.data);
    } catch (err) {
      console.warn("Supabase fetch failed, fallback to local storage state", err);
    }
  };

  // Load from localStorage or Supabase on mount
  useEffect(() => {
    if (isSupabaseConfigured()) {
      fetchSupabaseData();
    } else {
      const localRole = localStorage.getItem("dayflow_role");
      const localEmployees = localStorage.getItem("dayflow_employees");
      const localAttendance = localStorage.getItem("dayflow_attendance");
      const localLeaves = localStorage.getItem("dayflow_leaves");
      const localLogs = localStorage.getItem("dayflow_logs");

      if (localRole) setRole(localRole as "admin" | "employee");
      if (localEmployees) {
        try {
          setEmployees(JSON.parse(localEmployees));
        } catch {}
      }
      if (localAttendance) {
        try {
          setAttendance(JSON.parse(localAttendance));
        } catch {}
      }
      if (localLeaves) {
        try {
          setLeaves(JSON.parse(localLeaves));
        } catch {}
      }
      if (localLogs) {
        try {
          setAuditLogs(JSON.parse(localLogs));
        } catch {}
      }
    }
  }, []);

  // Save updates to localStorage
  const saveState = (key: string, value: any) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };

  const handleSetRole = (role: "admin" | "employee") => {
    setRole(role);
    saveState("dayflow_role", role);
  };

  const addAuditLog = (action: string, user: string) => {
    const newLog: AuditLog = {
      id: `log${Date.now()}`,
      user,
      action,
      timestamp: "Just now",
      ipAddress: "127.0.0.1",
    };
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    saveState("dayflow_logs", updated);
  };

  const checkIn = async (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) throw new Error("Employee not found");

    const result = await executeCheckIn({ employeeId, workMode: "office" }, emp.name, attendance);
    if (!result.success || !result.record) {
      throw new Error(result.error || "Check-in failed");
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("attendance").upsert([result.record]);
        await supabase.from("employees").update({ status: "Active" }).eq("id", employeeId);
      } catch (err) {
        console.error("Supabase checkIn error:", err);
      }
    }

    const updated = [result.record, ...attendance.filter((a) => !(a.employeeId === employeeId && a.date === result.record!.date))];
    setAttendance(updated);
    saveState("dayflow_attendance", updated);

    // Update employee status
    const updatedEmployees = employees.map((e) =>
      e.id === employeeId ? { ...e, status: "Active" as const } : e
    );
    setEmployees(updatedEmployees);
    saveState("dayflow_employees", updatedEmployees);

    addAuditLog(`checked in at ${result.record.checkIn}`, emp.name);
  };

  const checkOut = async (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    const result = await executeCheckOut({ employeeId, breakMinutes: 0 }, attendance);
    if (!result.success || !result.record) {
      throw new Error(result.error || "Check-out failed");
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("attendance")
          .update({
            checkOut: result.record.checkOut,
            workHours: result.record.workHours,
            extraHours: result.record.extraHours,
          })
          .eq("id", result.record.id);
        await supabase.from("employees").update({ status: "Away" }).eq("id", employeeId);
      } catch (err) {
        console.error("Supabase checkOut error:", err);
      }
    }

    const updatedAttendance = attendance.map((log) =>
      log.id === result.record!.id ? result.record! : log
    );
    if (!updatedAttendance.some((l) => l.id === result.record!.id)) {
      updatedAttendance.unshift(result.record!);
    }
    setAttendance(updatedAttendance);
    saveState("dayflow_attendance", updatedAttendance);

    // Update employee status
    const updatedEmployees = employees.map((e) =>
      e.id === employeeId ? { ...e, status: "Away" as const } : e
    );
    setEmployees(updatedEmployees);
    saveState("dayflow_employees", updatedEmployees);

    addAuditLog(`checked out at ${result.record.checkOut} (${result.record.workHours} worked)`, emp ? emp.name : result.record.employeeName);
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

    // Zod schema enforcement
    const validated = leaveRequestSchema.safeParse(newRequest);
    if (!validated.success) {
      const errorMsg = validated.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      alert(`Leave Request Failed Validation: ${errorMsg}`);
      return;
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("leaves").insert([validated.data]);
      } catch (err) {
        console.error(err);
      }
    }

    const updated = [validated.data, ...leaves];
    setLeaves(updated);
    saveState("dayflow_leaves", updated);

    addAuditLog(`requested ${leave.type} (${leave.dates})`, emp.name);
  };

  const updateLeaveStatus = async (leaveId: string, status: "Approved" | "Rejected") => {
    const updated = leaves.map((l) =>
      l.id === leaveId ? { ...l, status } : l
    );

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("leaves").update({ status }).eq("id", leaveId);
      } catch (err) {
        console.error(err);
      }
    }

    setLeaves(updated);
    saveState("dayflow_leaves", updated);

    const leave = leaves.find((l) => l.id === leaveId);
    if (leave) {
      addAuditLog(`${status.toLowerCase()} leave request for ${leave.employeeName}`, "HR Admin");
      // Trigger server-side cache revalidation (non-blocking)
      srvUpdateLeave(leaveId, status, "HR Admin").catch(() => null);
    }
  };

  const updateSalaryProfile = async (employeeId: string, salary: SalaryProfile) => {
    // Validate salary computation rules via Zod
    const validated = salaryProfileSchema.safeParse(salary);
    if (!validated.success) {
      const errorMsg = validated.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      alert(`Invalid Salary Structure: ${errorMsg}`);
      return;
    }

    const updated = employees.map((e) =>
      e.id === employeeId ? { ...e, salary: validated.data } : e
    );

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("employees").update({ salary: validated.data }).eq("id", employeeId);
      } catch (err) {
        console.error(err);
      }
    }

    setEmployees(updated);
    saveState("dayflow_employees", updated);

    const emp = employees.find((e) => e.id === employeeId);
    if (emp) {
      addAuditLog(`updated salary structure for ${emp.name}`, "HR Admin");
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setRole: handleSetRole,
        currentUser: employees[0] || initialEmployees[0],
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
        refreshData: fetchSupabaseData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppContextProvider");
  }
  return context;
};
