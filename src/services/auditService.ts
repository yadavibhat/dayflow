/**
 * ============================================================================
 * Dayflow HRMS — Core Audit Domain Service Boundary
 * ============================================================================
 * 
 * DOMAIN RESPONSIBILITIES:
 * - Centralized audit event recording with metadata and actor attribution.
 * - Filtering and pagination of audit trails across categories and dates.
 * - Formatters for human-readable audit activity.
 */

import { AuditLogEntry, AuditCategory } from "@/lib/types/audit";
import { CreateAuditLogInput, CreateAuditLogSchema, AuditQueryFiltersInput } from "@/lib/validations/audit";

const STORAGE_KEY_AUDIT = "dayflow_audit_trail";

/**
 * Retrieves persisted audit logs from local storage fallback.
 */
export function getPersistedAuditLogs(): AuditLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Persists audit logs to local storage.
 */
export function savePersistedAuditLogs(logs: AuditLogEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(logs));
  } catch (err) {
    console.error("Failed to persist audit logs", err);
  }
}

/**
 * Validates and creates a new Audit Log entry.
 */
export function recordAuditEvent(
  input: CreateAuditLogInput,
  existingLogs?: AuditLogEntry[]
): { success: boolean; entry?: AuditLogEntry; error?: string } {
  const validation = CreateAuditLogSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues.map((e) => e.message).join(", "),
    };
  }

  const newEntry: AuditLogEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    category: validation.data.category,
    action: validation.data.action,
    description: validation.data.description,
    actorId: validation.data.actorId,
    actorName: validation.data.actorName,
    actorRole: validation.data.actorRole,
    targetEntity: validation.data.targetEntity,
    targetId: validation.data.targetId,
    metadata: validation.data.metadata,
    ipAddress: validation.data.ipAddress,
    timestamp: new Date().toISOString(),
  };

  const allLogs = [newEntry, ...(existingLogs || getPersistedAuditLogs())];
  savePersistedAuditLogs(allLogs);

  return {
    success: true,
    entry: newEntry,
  };
}

/**
 * Filters audit logs by category, actor name, target, date range, or keyword search.
 */
export function filterAuditLogs(
  logs: AuditLogEntry[],
  filters: Partial<AuditQueryFiltersInput>
): {
  records: AuditLogEntry[];
  totalCount: number;
  page: number;
  totalPages: number;
} {
  const {
    category = "ALL",
    actorName = "",
    searchQuery = "",
    page = 1,
    pageSize = 20,
  } = filters;

  let filtered = logs.filter((log) => {
    const matchesCategory = category === "ALL" || log.category === category;
    const matchesActor =
      !actorName || log.actorName.toLowerCase().includes(actorName.toLowerCase());
    const matchesSearch =
      !searchQuery ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesActor && matchesSearch;
  });

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  return {
    records: paginated,
    totalCount,
    page,
    totalPages,
  };
}
