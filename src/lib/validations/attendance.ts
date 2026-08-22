import { z } from "zod";

export const CheckInSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  notes: z.string().max(250, "Notes cannot exceed 250 characters").optional(),
  workMode: z.enum(["office", "remote", "hybrid"]).default("office"),
  locationNote: z.string().max(100).optional(),
});

export const CheckOutSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  notes: z.string().max(250, "Notes cannot exceed 250 characters").optional(),
  breakMinutes: z.number().min(0).max(480).default(0),
});

export type CheckInInput = z.infer<typeof CheckInSchema>;
export type CheckOutInput = z.infer<typeof CheckOutSchema>;
