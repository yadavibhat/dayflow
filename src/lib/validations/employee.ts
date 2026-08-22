import { z } from "zod";

// 1. Schema for normal employees editing their own profile details
export const EmployeeSelfEditSchema = z.object({
  phone: z.string().min(5, "Phone number must be at least 5 characters").or(z.literal("")).optional().nullable(),
  address: z.string().min(5, "Address must be at least 5 characters").or(z.literal("")).optional().nullable(),
  email: z.string().email("Invalid email format").or(z.literal("")).optional().nullable(),
  avatar: z.string().or(z.literal("")).optional().nullable(),
}).strict();

// 2. Schema for HR/Admin editing other employees' profiles (excluding salary and login ID fields)
export const EmployeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().min(5, "Phone number must be at least 5 characters").or(z.literal("")).optional().nullable(),
  address: z.string().min(5, "Address must be at least 5 characters").or(z.literal("")).optional().nullable(),
  dob: z.string().or(z.literal("")).optional().nullable(),
  nationality: z.string().min(1, "Nationality is required").or(z.literal("")).optional().nullable(),
  maritalStatus: z.string().or(z.literal("")).optional().nullable(),
  email: z.string().email("Invalid email format").or(z.literal("")).optional().nullable(),
  avatar: z.string().or(z.literal("")).optional().nullable(),
  bankName: z.string().min(1, "Bank name is required").or(z.literal("")).optional().nullable(),
  accountNo: z.string().min(4, "Account number must be at least 4 digits").or(z.literal("")).optional().nullable(),
  routingNo: z.string().min(4, "Routing/IFSC must be at least 4 characters").or(z.literal("")).optional().nullable(),
  panTaxId: z.string().min(1, "PAN/Tax ID is required").or(z.literal("")).optional().nullable(),
  uan: z.string().min(1, "UAN is required").or(z.literal("")).optional().nullable(),
  
  // Job-specific fields (HR/Admin only)
  department: z.enum(["Design", "Engineering", "Marketing", "Finance", "HR"]).optional(),
  role: z.string().min(2, "Designation must be at least 2 characters").optional(),
  manager_id: z.string().or(z.literal("")).optional().nullable(),
  doj: z.string().min(1, "Date of joining is required").optional(),
}).strict();
