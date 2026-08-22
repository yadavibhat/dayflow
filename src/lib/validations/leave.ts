import { z } from "zod";

export const LeaveTypeEnum = z.enum([
  "Paid Time Off",
  "Sick Leave",
  "Casual Leave",
  "Unpaid Leave",
  "Parental Leave",
]);

export type LeaveType = z.infer<typeof LeaveTypeEnum>;

export const LeaveRequestInputSchema = z
  .object({
    employeeId: z.string().min(1, "Employee ID is required"),
    type: LeaveTypeEnum,
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),
    reason: z.string().trim().min(3, "Reason must be at least 3 characters long"),
    attachmentUrl: z.string().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: "End date must be on or after start date",
      path: ["endDate"],
    }
  );

export type LeaveRequestInput = z.infer<typeof LeaveRequestInputSchema>;
