"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getAuthedUserId } from "@/lib/auth";
import { deriveStatus } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { recordAudit } from "@/lib/services/audit";
import { getBalance, verifyMeter } from "@/lib/services/desco";
import {
  createMeterSchema,
  meterIdSchema,
  updateMeterSchema,
  toFieldErrors,
} from "@/lib/validations";
import type { ActionResult, Meter } from "@/types";

/**
 * Server Actions for meter CRUD and manual balance checks.
 *
 * Security invariants enforced in EVERY action here:
 *   1. The user id comes from the verified session — never from the payload.
 *   2. The payload is re-parsed with Zod server-side; client validation is a
 *      convenience, not a control.
 *   3. Ownership is re-checked before any update/delete, in addition to RLS.
 *   4. Errors return a translation key or a safe message — never a stack trace,
 *      a raw Postgres error, or anything containing credentials.
 */

/** Maps a DB/network failure to a safe, user-facing message. */
function safeError(message: string): string {
  // Postgres unique-violation on (user_id, meter_number).
  if (message.includes("meters_unique_per_user")) {
    return "meterToast.duplicate";
  }
  if (message.includes("meters_threshold_order")) {
    return "validation.thresholdOrder";
  }
  return "error.generic";
}

export async function createMeterAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const userId = await getAuthedUserId();
  if (!userId) return { success: false, error: "error.sessionExpired" };

  const parsed = createMeterSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "validation.required",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }
  const data = parsed.data;

  // Both this and "Check Now" drive the upstream DESCO API; share one per-user
  // budget so neither can be used to hammer it.
  if (!rateLimit(`desco:${userId}`, 30, 60_000).ok) {
    return { success: false, error: "error.rateLimited" };
  }

  // Verify against DESCO before persisting. A typo'd meter would otherwise
  // become a row that silently fails every scheduled check forever.
  const verification = await verifyMeter(data.accountNumber, data.meterNumber);
  if (!verification.ok) {
    return {
      success: false,
      error:
        verification.kind === "not_found"
          ? "meterToast.verifyFailed"
          : "meterToast.checkFailed",
      fieldErrors:
        verification.kind === "not_found"
          ? { meterNumber: ["meterToast.verifyFailed"] }
          : undefined,
    };
  }

  const balance = verification.data.balance;
  const supabase = await createClient();

  const { data: inserted, error } = await supabase
    .from("meters")
    .insert({
      // user_id is the SESSION's id. RLS `WITH CHECK (user_id = auth.uid())`
      // would reject anything else even if this line were wrong.
      user_id: userId,
      name: data.name,
      meter_number: data.meterNumber,
      account_number: data.accountNumber,
      threshold: data.threshold,
      critical_threshold: data.criticalThreshold,
      monitoring_enabled: data.monitoringEnabled,
      email_alert_enabled: data.emailAlertEnabled,
      current_balance: balance,
      status: deriveStatus(balance, data.threshold, data.criticalThreshold),
      last_checked_at: new Date().toISOString(),
      current_month_consumption: verification.data.currentMonthConsumption,
      reading_time: verification.data.readingTime,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { success: false, error: safeError(error?.message ?? "") };
  }

  // The verification call already produced a real reading — store it so the
  // meter's history starts immediately rather than after the next cron run.
  await supabase.from("balance_readings").insert({
    meter_id: inserted.id,
    balance,
    reading_time: verification.data.readingTime,
    current_month_consumption: verification.data.currentMonthConsumption,
    source: "manual",
    status: "success",
  });

  const profile = await getCurrentProfile();
  await recordAudit({
    userId,
    actorEmail: profile?.email ?? null,
    action: "METER_CREATED",
    entityType: "meter",
    entityId: inserted.id,
    // Meter/account numbers are deliberately NOT logged.
    metadata: { name: data.name },
  });

  revalidatePath("/meters");
  revalidatePath("/dashboard");

  return {
    success: true,
    data: { id: inserted.id },
    message: "meterToast.added",
  };
}

export async function updateMeterAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const userId = await getAuthedUserId();
  if (!userId) return { success: false, error: "error.sessionExpired" };

  const parsed = updateMeterSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "validation.required",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }
  const data = parsed.data;
  const supabase = await createClient();

  // Confirm ownership before writing. RLS also enforces this; doing it here
  // lets us return "not found" instead of a silent zero-row update.
  const { data: existing } = await supabase
    .from("meters")
    .select(
      "id, current_balance, meter_number, account_number, threshold, critical_threshold",
    )
    .eq("id", data.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) return { success: false, error: "meterToast.notFound" };

  const typedExisting = existing as {
    id: string;
    current_balance: number | null;
    meter_number: string;
    account_number: string;
  };

  // If the physical meter identity changed, the old balance/history no longer
  // applies. Re-verify against DESCO first — otherwise a typo would sit here
  // failing every scheduled run, and a stale balance would be shown as if it
  // belonged to the new meter.
  const identityChanged =
    typedExisting.meter_number !== data.meterNumber ||
    typedExisting.account_number !== data.accountNumber;

  if (identityChanged) {
    if (!rateLimit(`desco:${userId}`, 30, 60_000).ok) {
      return { success: false, error: "error.rateLimited" };
    }
    const verification = await verifyMeter(
      data.accountNumber,
      data.meterNumber,
    );
    if (!verification.ok) {
      return {
        success: false,
        error:
          verification.kind === "not_found"
            ? "meterToast.verifyFailed"
            : "meterToast.checkFailed",
        fieldErrors:
          verification.kind === "not_found"
            ? { meterNumber: ["meterToast.verifyFailed"] }
            : undefined,
      };
    }
    const freshBalance = verification.data.balance;
    const freshStatus = data.monitoringEnabled
      ? deriveStatus(
          freshBalance,
          data.threshold,
          data.criticalThreshold,
        )
      : "disabled";
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("meters")
      .update({
        name: data.name,
        meter_number: data.meterNumber,
        account_number: data.accountNumber,
        threshold: data.threshold,
        critical_threshold: data.criticalThreshold,
        monitoring_enabled: data.monitoringEnabled,
        email_alert_enabled: data.emailAlertEnabled,
        current_balance: freshBalance,
        status: freshStatus,
        last_checked_at: now,
        last_error: null,
        current_month_consumption:
          verification.data.currentMonthConsumption,
        reading_time: verification.data.readingTime,
      })
      .eq("id", data.id)
      .eq("user_id", userId);

    if (error) return { success: false, error: safeError(error.message) };

    await supabase.from("balance_readings").insert({
      meter_id: data.id,
      balance: freshBalance,
      reading_time: verification.data.readingTime,
      current_month_consumption:
        verification.data.currentMonthConsumption,
      source: "manual",
      status: "success",
    });

    const profile = await getCurrentProfile();
    await recordAudit({
      userId,
      actorEmail: profile?.email ?? null,
      action: "METER_UPDATED",
      entityType: "meter",
      entityId: data.id,
      metadata: { name: data.name },
    });

    revalidatePath("/meters");
    revalidatePath(`/meters/${data.id}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      data: { id: data.id },
      message: "meterToast.updated",
    };
  }

  // Thresholds may have moved, so the stored status must be recomputed against
  // the balance we already have — otherwise a meter can sit in a stale state
  // until the next scheduled check.
  const balance = typedExisting.current_balance as number | null;
  const nextStatus = data.monitoringEnabled
    ? balance === null
      ? "checking"
      : deriveStatus(balance, data.threshold, data.criticalThreshold)
    : "disabled";

  const { error } = await supabase
    .from("meters")
    .update({
      name: data.name,
      meter_number: data.meterNumber,
      account_number: data.accountNumber,
      threshold: data.threshold,
      critical_threshold: data.criticalThreshold,
      monitoring_enabled: data.monitoringEnabled,
      email_alert_enabled: data.emailAlertEnabled,
      status: nextStatus,
    })
    .eq("id", data.id)
    .eq("user_id", userId);

  if (error) return { success: false, error: safeError(error.message) };

  const profile = await getCurrentProfile();
  await recordAudit({
    userId,
    actorEmail: profile?.email ?? null,
    action: "METER_UPDATED",
    entityType: "meter",
    entityId: data.id,
    metadata: { name: data.name },
  });

  revalidatePath("/meters");
  revalidatePath(`/meters/${data.id}`);
  revalidatePath("/dashboard");

  return {
    success: true,
    data: { id: data.id },
    message: "meterToast.updated",
  };
}

export async function deleteMeterAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const userId = await getAuthedUserId();
  if (!userId) return { success: false, error: "error.sessionExpired" };

  const parsed = meterIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "meterToast.notFound" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("meters")
    .select("id, name")
    .eq("id", parsed.data.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) return { success: false, error: "meterToast.notFound" };

  const { error } = await supabase
    .from("meters")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", userId);

  if (error) return { success: false, error: "error.generic" };

  const profile = await getCurrentProfile();
  await recordAudit({
    userId,
    actorEmail: profile?.email ?? null,
    action: "METER_DELETED",
    entityType: "meter",
    entityId: parsed.data.id,
    metadata: { name: existing.name },
  });

  revalidatePath("/meters");
  revalidatePath("/dashboard");

  return {
    success: true,
    data: { id: parsed.data.id },
    message: "meterToast.deleted",
  };
}

/**
 * "Check Now" — polls DESCO immediately for one meter.
 *
 * On failure the meter is marked `error` with the reason recorded, and a FAILED
 * reading row is written. The action reports the failure honestly; it never
 * pretends the check succeeded and never writes a fabricated balance.
 */
export async function checkMeterBalanceAction(
  input: unknown,
): Promise<ActionResult<{ balance: number; status: Meter["status"] }>> {
  const userId = await getAuthedUserId();
  if (!userId) return { success: false, error: "error.sessionExpired" };

  const parsed = meterIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "meterToast.notFound" };

  // Shared per-user DESCO budget (see createMeterAction).
  if (!rateLimit(`desco:${userId}`, 30, 60_000).ok) {
    return { success: false, error: "error.rateLimited" };
  }

  const supabase = await createClient();
  const { data: meter } = await supabase
    .from("meters")
    .select("*")
    .eq("id", parsed.data.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!meter) return { success: false, error: "meterToast.notFound" };
  const typedMeter = meter as Meter;

  const result = await getBalance(
    typedMeter.account_number,
    typedMeter.meter_number,
  );

  if (!result.ok) {
    await supabase
      .from("meters")
      .update({
        status: "error",
        last_error: result.error,
        last_checked_at: new Date().toISOString(),
      })
      .eq("id", typedMeter.id)
      .eq("user_id", userId);

    await supabase.from("balance_readings").insert({
      meter_id: typedMeter.id,
      // A failed check has no balance. The last known value is repeated so the
      // NOT NULL column is satisfied, and `status: failed` marks it as not a
      // real observation — history queries filter on status = 'success'.
      balance: typedMeter.current_balance ?? 0,
      source: "manual",
      status: "failed",
      error_message: result.error,
    });

    revalidatePath("/meters");
    revalidatePath(`/meters/${typedMeter.id}`);

    return {
      success: false,
      error:
        result.kind === "not_found"
          ? "meterToast.verifyFailed"
          : "meterToast.checkFailed",
    };
  }

  const balance = result.data.balance;
  const status = deriveStatus(
    balance,
    Number(typedMeter.threshold),
    Number(typedMeter.critical_threshold),
  );
  const now = new Date().toISOString();

  await supabase
    .from("meters")
    .update({
      current_balance: balance,
      status: typedMeter.monitoring_enabled ? status : "disabled",
      last_checked_at: now,
      last_error: null,
      current_month_consumption: result.data.currentMonthConsumption,
      reading_time: result.data.readingTime,
    })
    .eq("id", typedMeter.id)
    .eq("user_id", userId);

  await supabase.from("balance_readings").insert({
    meter_id: typedMeter.id,
    balance,
    reading_time: result.data.readingTime,
    current_month_consumption: result.data.currentMonthConsumption,
    source: "manual",
    status: "success",
  });

  const profile = await getCurrentProfile();
  await recordAudit({
    userId,
    actorEmail: profile?.email ?? null,
    action: "BALANCE_CHECK",
    entityType: "meter",
    entityId: typedMeter.id,
    metadata: { source: "manual", status },
  });

  revalidatePath("/meters");
  revalidatePath(`/meters/${typedMeter.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/analytics");

  return {
    success: true,
    data: { balance, status },
    message: "meterToast.balanceUpdated",
  };
}
