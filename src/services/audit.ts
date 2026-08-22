"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/services/employees";

/**
 * Fetches audit logs (HR only, paginated by created_at descending).
 */
export async function fetchAuditLogs(page: number = 1, pageSize: number = 10) {
  try {
    const supabase = await createClient();
    const { profile, error: authErr } = await getCurrentProfile();
    if (authErr || !profile) {
      return { success: false, error: "Unauthorized" };
    }

    if (profile.role === "employee") {
      return { success: false, error: "Access Denied: HR or Admin role required" };
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data, count, error } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(fromIndex, toIndex);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data,
      totalCount: count || 0,
      page,
      pageSize,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch audit logs" };
  }
}

/**
 * Helper to record audit trail entries. Every future mutation will call this.
 */
export async function writeAuditLog(
  actorId: string,
  entityType: string,
  entityId: string,
  action: string,
  beforeJson: any,
  afterJson: any
) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("audit_logs").insert({
      actor_id: actorId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      before_json: beforeJson,
      after_json: afterJson,
    });

    if (error) {
      console.error("Failed to write audit log to database:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Audit log write error:", err.message);
    return { success: false, error: err.message };
  }
}
