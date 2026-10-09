import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { AuditAction } from "@/types";

/**
 * Audit trail writer.
 *
 * Uses the service-role client because `audit_logs` has NO client-writable RLS
 * policy — the trail cannot be forged or erased from a browser. Writing it here
 * is the only path in.
 *
 * NEVER pass secrets in `metadata`. Meter/account numbers are considered
 * sensitive too: log the meter's UUID, not its DESCO number.
 */
export async function recordAudit(params: {
  userId: string | null;
  actorEmail: string | null;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  result?: "success" | "failure";
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("audit_logs").insert({
      user_id: params.userId,
      actor_email: params.actorEmail,
      action: params.action,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? null,
      result: params.result ?? "success",
    });
    if (error) {
      console.error("[audit] write failed:", error.message);
    }
  } catch (error) {
    // Auditing must never break the user-facing operation it describes.
    // The failure is logged and swallowed.
    console.error(
      "[audit] write threw:",
      error instanceof Error ? error.message : "unknown error",
    );
  }
}
