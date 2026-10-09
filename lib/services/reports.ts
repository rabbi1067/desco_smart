import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getAuthedUserId } from "@/lib/auth";
import { resolveDisplayStatus } from "@/lib/constants";
import type {
  AlertDeliveryStatus,
  AlertType,
  MeterStatus,
  ReadingStatus,
  ReportFilters,
} from "@/types";

/**
 * Read-side data access for the Reports page.
 *
 * Like `lib/services/meters.ts`, every query runs through the *user-scoped*
 * Supabase client so RLS applies, and each is additionally constrained by an
 * explicit `user_id` (or `meters.user_id`) filter as a second barrier. Nothing
 * here fabricates rows: an empty result set is returned as an empty array and
 * the UI renders an empty state.
 *
 * Dates arrive as `YYYY-MM-DD` and are widened to a full Dhaka-time day so the
 * range is inclusive of both endpoints regardless of the stored UTC instant.
 */

/** Hard cap so a report can never pull an unbounded number of rows. */
const REPORT_ROW_LIMIT = 2000;

export interface BalanceHistoryRow {
  id: string;
  checkedAt: string;
  meterName: string;
  balance: number;
  consumption: number | null;
  status: ReadingStatus;
}

export interface AlertHistoryRow {
  id: string;
  createdAt: string;
  meterName: string;
  type: AlertType;
  balance: number;
  threshold: number;
  status: AlertDeliveryStatus;
}

export interface MeterHealthRow {
  id: string;
  name: string;
  meterNumber: string;
  balance: number | null;
  threshold: number;
  criticalThreshold: number;
  status: MeterStatus;
  monitoringEnabled: boolean;
  lastCheckedAt: string | null;
}

/** Discriminated by `type` so the renderer/export can switch without casts. */
export type ReportData =
  | { type: "balance_history"; rows: BalanceHistoryRow[] }
  | { type: "alert_history"; rows: AlertHistoryRow[] }
  | { type: "meter_health"; rows: MeterHealthRow[] };

/** Start-of-day in Dhaka time for an ISO date (inclusive lower bound). */
function dayStart(isoDate: string): string {
  return `${isoDate}T00:00:00+06:00`;
}

/** End-of-day in Dhaka time for an ISO date (inclusive upper bound). */
function dayEnd(isoDate: string): string {
  return `${isoDate}T23:59:59.999+06:00`;
}

export async function getReport(filters: ReportFilters): Promise<ReportData> {
  switch (filters.type) {
    case "balance_history":
      return { type: "balance_history", rows: await getBalanceHistoryRows(filters) };
    case "alert_history":
      return { type: "alert_history", rows: await getAlertHistoryRows(filters) };
    case "meter_health":
      return { type: "meter_health", rows: await getMeterHealthRows(filters) };
  }
}

async function getBalanceHistoryRows(
  filters: ReportFilters,
): Promise<BalanceHistoryRow[]> {
  const userId = await getAuthedUserId();
  if (!userId) return [];

  const supabase = await createClient();
  // Join meters for the display name and to scope by owner (mirrors
  // getRecentReadings). RLS on balance_readings already restricts to the
  // caller; `meters.user_id` is the explicit second barrier.
  let query = supabase
    .from("balance_readings")
    .select("id, checked_at, balance, current_month_consumption, status, meters!inner(name, user_id)")
    .eq("meters.user_id", userId)
    .gte("checked_at", dayStart(filters.dateFrom))
    .lte("checked_at", dayEnd(filters.dateTo))
    .order("checked_at", { ascending: false })
    .limit(REPORT_ROW_LIMIT);

  if (filters.meterId) query = query.eq("meter_id", filters.meterId);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) {
    console.error("[reports] balance_history failed:", error.message);
    return [];
  }

  type Row = {
    id: string;
    checked_at: string;
    balance: number;
    current_month_consumption: number | null;
    status: ReadingStatus;
    meters: { name: string } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    checkedAt: row.checked_at,
    meterName: row.meters?.name ?? "—",
    balance: row.balance,
    consumption: row.current_month_consumption,
    status: row.status,
  }));
}

async function getAlertHistoryRows(
  filters: ReportFilters,
): Promise<AlertHistoryRow[]> {
  const userId = await getAuthedUserId();
  if (!userId) return [];

  const supabase = await createClient();
  let query = supabase
    .from("alerts")
    .select("id, created_at, type, balance, threshold, status, meters!inner(name)")
    .eq("user_id", userId)
    .gte("created_at", dayStart(filters.dateFrom))
    .lte("created_at", dayEnd(filters.dateTo))
    .order("created_at", { ascending: false })
    .limit(REPORT_ROW_LIMIT);

  if (filters.meterId) query = query.eq("meter_id", filters.meterId);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) {
    console.error("[reports] alert_history failed:", error.message);
    return [];
  }

  type Row = {
    id: string;
    created_at: string;
    type: AlertType;
    balance: number;
    threshold: number;
    status: AlertDeliveryStatus;
    meters: { name: string } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    meterName: row.meters?.name ?? "—",
    type: row.type,
    balance: row.balance,
    threshold: row.threshold,
    status: row.status,
  }));
}

async function getMeterHealthRows(
  filters: ReportFilters,
): Promise<MeterHealthRow[]> {
  const userId = await getAuthedUserId();
  if (!userId) return [];

  const supabase = await createClient();
  let query = supabase
    .from("meters")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (filters.meterId) query = query.eq("id", filters.meterId);

  const { data, error } = await query;
  if (error) {
    console.error("[reports] meter_health failed:", error.message);
    return [];
  }

  // Display status is derived, not a column, so status filtering happens here.
  const rows = (data ?? []).map((meter) => ({
    id: meter.id,
    name: meter.name,
    meterNumber: meter.meter_number,
    balance: meter.current_balance,
    threshold: meter.threshold,
    criticalThreshold: meter.critical_threshold,
    status: resolveDisplayStatus(meter),
    monitoringEnabled: meter.monitoring_enabled,
    lastCheckedAt: meter.last_checked_at,
  }));

  return filters.status
    ? rows.filter((row) => row.status === filters.status)
    : rows;
}
