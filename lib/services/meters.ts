import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUserId } from "@/lib/auth";
import { compareByUrgency, resolveDisplayStatus } from "@/lib/constants";
import type {
  Alert,
  BalanceReading,
  FleetSummary,
  Meter,
  MeterStatus,
} from "@/types";

/**
 * Read-side data access for meters.
 *
 * Every query here runs through the *user-scoped* Supabase client, so RLS
 * applies. The explicit `.eq("user_id", …)` filters are a deliberate second
 * barrier: if a policy were ever mis-deployed, these still scope the result.
 *
 * Nothing in this module invents data. When there is no row, callers get an
 * empty array or null and the UI renders an empty state.
 */

/**
 * Per-request memoised fleet fetch.
 *
 * `cache()` dedupes simultaneous calls within ONE render pass (layout +
 * page both call `getMeters()`), so the dashboard no longer issues the same
 * Supabase query twice. It is request-scoped — never shared across users —
 * so there is no cross-account leak. Mutations still call
 * `revalidatePath()` which starts a fresh request on the next navigation.
 */
export const getMeters = cache(async (): Promise<Meter[]> => {
  const userId = await getAuthedUserId();
  if (!userId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meters")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    // Log the message only — never the row payload, which could contain
    // meter/account numbers.
    console.error("[meters] getMeters failed:", error.message);
    return [];
  }

  const meters = (data ?? []) as Meter[];
  // Most urgent first, so a critical meter is never below the fold.
  return meters.sort((a, b) =>
    compareByUrgency(resolveDisplayStatus(a), resolveDisplayStatus(b)),
  );
});

export async function getMeterById(id: string): Promise<Meter | null> {
  const userId = await getAuthedUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meters")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Meter;
}

export async function getMeterCount(): Promise<number> {
  const userId = await getAuthedUserId();
  if (!userId) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("meters")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) return 0;
  return count ?? 0;
}

/**
 * Aggregates the dashboard's summary tiles from real rows.
 *
 * `totalBalance` sums only meters that actually have a balance — a never-checked
 * meter contributes nothing rather than being counted as ৳0.
 */
export function summariseFleet(meters: Meter[]): FleetSummary {
  const summary: FleetSummary = {
    total: meters.length,
    healthy: 0,
    low: 0,
    critical: 0,
    disabled: 0,
    error: 0,
    totalBalance: 0,
  };

  for (const meter of meters) {
    const status = resolveDisplayStatus(meter);
    switch (status) {
      case "healthy":
        summary.healthy += 1;
        break;
      case "low":
        summary.low += 1;
        break;
      case "critical":
        summary.critical += 1;
        break;
      case "disabled":
        summary.disabled += 1;
        break;
      case "error":
        summary.error += 1;
        break;
      default:
        break;
    }
    if (typeof meter.current_balance === "number") {
      summary.totalBalance += meter.current_balance;
    }
  }

  return summary;
}

export async function getFleetSummary(): Promise<FleetSummary> {
  return summariseFleet(await getMeters());
}

/** Balance readings for one meter, oldest→newest so charts plot left to right. */
export async function getBalanceHistory(
  meterId: string,
  limit = 200,
): Promise<BalanceReading[]> {
  const userId = await getAuthedUserId();
  if (!userId) return [];

  const supabase = await createClient();
  // Ownership is enforced by RLS on balance_readings (via the meters join),
  // and re-verified here before the query is issued.
  const meter = await getMeterById(meterId);
  if (!meter) return [];

  const { data, error } = await supabase
    .from("balance_readings")
    .select("*")
    .eq("meter_id", meterId)
    .eq("status", "success")
    .order("checked_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[meters] getBalanceHistory failed:", error.message);
    return [];
  }

  return ((data ?? []) as BalanceReading[]).reverse();
}

/** Readings across every meter the user owns — powers "Recent Activity". */
export const getRecentReadings = cache(
  async (limit = 10): Promise<(BalanceReading & { meter_name: string })[]> => {
    const userId = await getAuthedUserId();
    if (!userId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("balance_readings")
    .select("*, meters!inner(name, user_id)")
    .eq("meters.user_id", userId)
    .order("checked_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[meters] getRecentReadings failed:", error.message);
    return [];
  }

  type Row = BalanceReading & { meters: { name: string } | null };
  return ((data ?? []) as Row[]).map((row) => ({
    ...row,
    meter_name: row.meters?.name ?? "—",
  }));
});

export async function getAlerts(
  meterId?: string,
  limit = 50,
): Promise<Alert[]> {
  const userId = await getAuthedUserId();
  if (!userId) return [];

  const supabase = await createClient();
  let query = supabase
    .from("alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (meterId) query = query.eq("meter_id", meterId);

  const { data, error } = await query;
  if (error) {
    console.error("[meters] getAlerts failed:", error.message);
    return [];
  }
  return (data ?? []) as Alert[];
}

/** Meters needing attention, for the dashboard's priority panel. */
export function filterNeedsAttention(meters: Meter[]): Meter[] {
  const urgent: MeterStatus[] = ["critical", "low", "error"];
  return meters.filter((m) => urgent.includes(resolveDisplayStatus(m)));
}
