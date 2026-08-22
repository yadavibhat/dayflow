"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { executeCheckIn, executeCheckOut } from "@/services/attendanceService";

export interface SalaryProfile {
  base: number;
  basicPct: number;
  hraPct: number;
  stdPct: number;
  pfPct: number;
  ptFixed: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  status: "Active" | "Away" | "On Leave";
  avatar: string;
  email: string;
  phone: string;
  dob: string;
  nationality: string;
  maritalStatus: string;
  address: string;
  doj: string;
  bankName: string;
  accountNo: string;
  routingNo: string;
  panTaxId: string;
  uan: string;
  salary: SalaryProfile;
}

export interface AttendanceLog {
  id: string;
  employeeId: string;
  employeeName: string;
  checkIn: string; // e.g. "08:55 AM"
  checkOut: string; // e.g. "05:05 PM" or "--:--"
  workHours: string; // e.g. "8h 10m" or "--"
  extraHours: string; // e.g. "1h 30m" or "-"
  status: "Present" | "Late" | "On Leave";
  date: string; // e.g. "2026-08-22"
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  type: string; // e.g. "Paid Time Off", "Sick Leave"
  dates: string; // e.g. "Oct 12 - Oct 16"
  days: number;
  status: "Pending" | "Approved" | "Rejected";
  avatar: string;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  timestamp: string; // e.g. "2 mins ago"
  ipAddress: string;
}

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
    name: "Sarah Jenkins",
    role: "Senior UX Designer",
    department: "Design",
    status: "Active",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCsN9BslSZuNvbHJ31AIrtAKbS1q7MQQNwsSGoRi5uaPsFGZqVD9hLMwbNUfk7YMVP37UIQga81PK6KpOnkdIp-4LpPvGEVOy75hMJcpJWXVHb8hSI3OkDv9rXzpOCPbdxmwShAORvyG4N72qWPl3FJwewOD1hNofPRJr4MGSlRikay2egBCWyvyR1U0EVGQkwFM2XDDZWrYu6rpe4dJDUxYmofGF6ALukotpzmApBAP617Wl0tCG6L3w",
    email: "sarah.jenkins@company.com",
    phone: "+44 20 7946 0958",
    dob: "October 14, 1990",
    nationality: "American",
    maritalStatus: "Single",
    address: "1248 Horizon Boulevard, Apt 4B, San Francisco, CA 94107",
    doj: "March 01, 2021",
    bankName: "Chase Manhattan Bank",
    accountNo: "•••• •••• •••• 4921",
    routingNo: "CHASUS33XXX",
    panTaxId: "ABCDE1234F",
    uan: "100982736451",
    salary: {
      base: 85000,
      basicPct: 50,
      hraPct: 25,
      stdPct: 10,
      pfPct: 12,
      ptFixed: 200,
    },
  },
  {
    id: "2",
    name: "Marcus Chen",
    role: "Senior Developer",
    department: "Engineering",
    status: "Away",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJoImG_2tVUSWfkp6Pg61zn_u5pptX2HqwCkCf4OVnu3dYze7cDf3HsGqdsj-Ll0JEQF42Wo7mTNcQIcMPt4xVVBHvQkuJ_JHJDBDTfci4dR5zh6JZoOXBBGO0RQNTSP_Giw89gK8ALZ82FNyDtCIT9biu2N4kLpnZyGqkVUki1M8uehotf2nNEEiGIKyBhn6I5Ngq9LEqSYrf6IwngoWaPeJREJ61q8Mh2usETksR3F9LLdZnR--1jA",
    email: "marcus.chen@company.com",
    phone: "+44 20 7946 0192",
    dob: "November 23, 1988",
    nationality: "British",
    maritalStatus: "Married",
    address: "88 Baker Street, London, NW1 6XE",
    doj: "June 15, 2020",
    bankName: "HSBC UK",
    accountNo: "•••• •••• •••• 8102",
    routingNo: "MIDLGB21XXX",
    panTaxId: "XYZPQ9876G",
    uan: "100982736452",
    salary: {
      base: 95000,
      basicPct: 50,
      hraPct: 25,
      stdPct: 10,
      pfPct: 12,
      ptFixed: 200,
    },
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    role: "Marketing Lead",
    department: "Marketing",
    status: "On Leave",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6iNt060oLDzl0Q5PleQ07zGQSElZr0qsgtUK6yIlXipZTUU5JEykg6wcqKqA2GDXp12tQxKk0uJAYPQg3py53-_oX4rygENg1mYy15nkao1Oan97KVlM_6eAHDouBNWUyfxAD2UN7leaIv46W-1Tt_AQyynVmWsI7gy7sNxnB70vSsX6B_klsEakUvmB8jNtoE0O9y78FU9OqtbDORsf_fEKxF-Qa01pmM8060VX4G20bJ8bNKHppqA",
    email: "elena.rodriguez@company.com",
    phone: "+44 20 7946 0451",
    dob: "April 05, 1993",
    nationality: "Spanish",
    maritalStatus: "Single",
    address: "14 Valencia Court, London, SE1 7TY",
    doj: "September 10, 2022",
    bankName: "Santander UK",
    accountNo: "•••• •••• •••• 1290",
    routingNo: "SOCOGB2LXXX",
    panTaxId: "LMNOS4321H",
    uan: "100982736453",
    salary: {
      base: 75000,
      basicPct: 50,
      hraPct: 25,
      stdPct: 10,
      pfPct: 12,
      ptFixed: 200,
    },
  },
  {
    id: "4",
    name: "David Torres",
    role: "FinOps Manager",
    department: "Finance",
    status: "Active",
    avatar: "",
    email: "david.torres@company.com",
    phone: "+44 20 7946 0233",
    dob: "January 19, 1985",
    nationality: "Spanish",
    maritalStatus: "Married",
    address: "22 Gran Via, Madrid, Spain",
    doj: "January 15, 2019",
    bankName: "Banco Santander",
    accountNo: "•••• •••• •••• 5543",
    routingNo: "BSCHES28XXX",
    panTaxId: "TAXES5543T",
    uan: "100982736454",
    salary: {
      base: 80000,
      basicPct: 50,
      hraPct: 25,
      stdPct: 10,
      pfPct: 12,
      ptFixed: 200,
    },
  },
];

const initialAttendance: AttendanceLog[] = [
  {
    id: "a1",
    employeeId: "1",
    employeeName: "Sarah Jenkins",
    checkIn: "08:55 AM",
    checkOut: "05:05 PM",
    workHours: "8h 10m",
    extraHours: "-",
    status: "Present",
    date: "2026-08-21",
  },
  {
    id: "a2",
    employeeId: "2",
    employeeName: "Marcus Chen",
    checkIn: "09:15 AM",
    checkOut: "--:--",
    workHours: "--",
    extraHours: "-",
    status: "Late",
    date: "2026-08-22",
  },
  {
    id: "a3",
    employeeId: "3",
    employeeName: "Elena Rodriguez",
    checkIn: "--:--",
    checkOut: "--:--",
    workHours: "--",
    extraHours: "-",
    status: "On Leave",
    date: "2026-08-22",
  },
  {
    id: "a4",
    employeeId: "4",
    employeeName: "David Torres",
    checkIn: "08:00 AM",
    checkOut: "06:30 PM",
    workHours: "9h 00m",
    extraHours: "1h 30m",
    status: "Present",
    date: "2026-08-21",
  },
];

const initialLeaves: LeaveRequest[] = [
  {
    id: "l1",
    employeeId: "2",
    employeeName: "Michael Chen",
    department: "Engineering",
    type: "Paid Time Off",
    dates: "Oct 12 - Oct 16",
    days: 5,
    status: "Pending",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDloPnLQwoN5GqO4SUBvG20hfUAr8mlfe_SCKkX2aMOT5pD-su7BPlTQ1YMTVwvN3CCE6PBLQwKUfoRUnNTgPkhmeptesYnfdaJbCdXgODKePfuY4ZGDRLFYoElVvZxSD1dqZIp_uso4drVmf29Vk06zugztUG1hFuHIAZ9RfytaIvuYEtrFU7nGKem0rqFBRS3L0wA8jIoNSsIutlHCptMiPFjsX4McA9NqQFH-mnFuzDWKOpNY0eV9w",
  },
  {
    id: "l2",
    employeeId: "3",
    employeeName: "Elena Rodriguez",
    department: "Marketing",
    type: "Sick Leave",
    dates: "Oct 10 (Half Day)",
    days: 0.5,
    status: "Approved",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6iNt060oLDzl0Q5PleQ07zGQSElZr0qsgtUK6yIlXipZTUU5JEykg6wcqKqA2GDXp12tQxKk0uJAYPQg3py53-_oX4rygENg1mYy15nkao1Oan97KVlM_6eAHDouBNWUyfxAD2UN7leaIv46W-1Tt_AQyynVmWsI7gy7sNxnB70vSsX6B_klsEakUvmB8jNtoE0O9y78FU9OqtbDORsf_fEKxF-Qa01pmM8060VX4G20bJ8bNKHppqA",
  },
  {
    id: "l3",
    employeeId: "1",
    employeeName: "Sarah Jenkins",
    department: "Design",
    type: "Unpaid Leave",
    dates: "Nov 01 - Nov 05",
    days: 5,
    status: "Rejected",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCsN9BslSZuNvbHJ31AIrtAKbS1q7MQQNwsSGoRi5uaPsFGZqVD9hLMwbNUfk7YMVP37UIQga81PK6KpOnkdIp-4LpPvGEVOy75hMJcpJWXVHb8hSI3OkDv9rXzpOCPbdxmwShAORvyG4N72qWPl3FJwewOD1hNofPRJr4MGSlRikay2egBCWyvyR1U0EVGQkwFM2XDDZWrYu6rpe4dJDUxYmofGF6ALukotpzmApBAP617Wl0tCG6L3w",
  },
];

const initialAuditLogs: AuditLog[] = [
  {
    id: "log1",
    user: "Sarah Jenkins",
    action: "updated role mapping for Design Department",
    timestamp: "2 mins ago",
    ipAddress: "192.168.1.45",
  },
  {
    id: "log2",
    user: "System Auto",
    action: "generated monthly payroll report #PR-2023-10",
    timestamp: "1 hour ago",
    ipAddress: "System Process",
  },
  {
    id: "log3",
    user: "Michael Chang",
    action: "requested elevated permissions for FinOps Module",
    timestamp: "3 hours ago",
    ipAddress: "Pending Approval",
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentRole, setRole] = useState<"admin" | "employee">("admin");
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [attendance, setAttendance] = useState<AttendanceLog[]>(initialAttendance);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(initialLeaves);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
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
  }, []);

  // Save updates to localStorage
  const saveState = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const handleSetRole = (role: "admin" | "employee") => {
    setRole(role);
    localStorage.setItem("dayflow_role", role);
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

    const updatedAttendance = attendance.map((log) =>
      log.id === result.record!.id ? result.record! : log
    );
    // If not found in memory, add it
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

  const addEmployee = (employee: Omit<Employee, "id" | "salary"> & { baseSalary: number }) => {
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

    const updated = [...employees, newEmp];
    setEmployees(updated);
    saveState("dayflow_employees", updated);

    addAuditLog(`created profile for new employee ${employee.name}`, "HR Admin");
  };

  const requestLeave = (leave: Omit<LeaveRequest, "id" | "status" | "employeeName" | "department" | "avatar">) => {
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

    const updated = [newRequest, ...leaves];
    setLeaves(updated);
    saveState("dayflow_leaves", updated);

    addAuditLog(`submitted a request for ${leave.type} (${leave.dates})`, emp.name);
  };

  const updateLeaveStatus = (leaveId: string, status: "Approved" | "Rejected") => {
    const updatedLeaves = leaves.map((l) =>
      l.id === leaveId ? { ...l, status } : l
    );
    setLeaves(updatedLeaves);
    saveState("dayflow_leaves", updatedLeaves);

    const leave = leaves.find((l) => l.id === leaveId);
    if (leave) {
      addAuditLog(`${status.toLowerCase()} leave request for ${leave.employeeName}`, "HR Admin");

      // Update employee status to On Leave if Approved
      if (status === "Approved") {
        const todayStr = new Date().toISOString().split("T")[0];
        // Create an attendance record for On Leave
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

  const updateSalaryProfile = (employeeId: string, salary: SalaryProfile) => {
    const updatedEmployees = employees.map((e) =>
      e.id === employeeId ? { ...e, salary } : e
    );
    setEmployees(updatedEmployees);
    saveState("dayflow_employees", updatedEmployees);

    const emp = employees.find((e) => e.id === employeeId);
    if (emp) {
      addAuditLog(`updated payroll salary components for ${emp.name}`, "HR Admin");
    }
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
