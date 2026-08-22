import { z } from "zod";

/**
 * ============================================================================
 * Dayflow HRMS — Audit Domain Validation Schemas
 * ============================================================================
 */

export const AuditCategoryEnum = z.enum([
  "AUTH",
  "ATTENDANCE",
  "LEAVE",
  "PROFILE",
  "PAYROLL",
  "SYSTEM",
]);

export const CreateAuditLogSchema = z.object({
  category: AuditCategoryEnum,
  action: z.string().min(1, "Action name is required"),
  description: z.string().min(1, "Description is required"),
  actorId: z.string().optional(),
  actorName: z.string().min(1, "Actor name is required"),
  actorRole: z.enum(["admin", "employee", "hr", "system"]).default("system"),
  targetEntity: z.string().optional(),
  targetId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  ipAddress: z.string().default("127.0.0.1"),
});

export type CreateAuditLogInput = z.infer<typeof CreateAuditLogSchema>;

export const AuditQueryFiltersSchema = z.object({
  category: z.union([AuditCategoryEnum, z.literal("ALL")]).default("ALL"),
  actorName: z.string().optional(),
  targetEntity: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  searchQuery: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type AuditQueryFiltersInput = z.infer<typeof AuditQueryFiltersSchema>;
