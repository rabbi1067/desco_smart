import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth";
import type {
  AdminSystemStats,
  AlertDeliveryStatus,
  AlertType,
  AuditLog,
  MeterWithOwner,
  Notification,
  ProfileWithStats,
  ReadingStatus,
  SystemSetting,
} from "@/types";

/**
 * Super Admin data access.
 *
 * IMPORTANT: these functions use the service-role client, which bypasses RLS.
 * Every single one therefore re-checks `isAdmin()` first and returns an empty
 * result for a non-admin caller. The role is read from the verified session, not
 * from any client-supplied value.
 *
 * `import "server-only"` makes it a build error for this module to be pulled
 * into a client bundle.
 */

/** Guard used by every export below. Fails closed. */
async function assertAdmin(): Promise<boolean> {
  return isAdmin();
}

export async function getSystemStats(): Promise<AdminSystemStats> {
  const empty: AdminSystemStats = {
    totalUsers: 0,
    totalMeters: 0,
    activeMeters: 0,
    healthy: 0,
    low: 0,
    critical: 0,
    alertsToday: 0,
    failedChecks: 0,
    checksToday: 0,
    successfulChecksToday: 0,
  };
  if (!(await assertAdmin())) return empty;

  const supabase = createAdminClient();
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const since = startOfToday.toISOString();

  /** Count-only query — `head: true` transfers no rows, just the count. */
  const countRows = (table: string) =>
    supabase.from(table).select("id", { count: "exact", head: true });

  const [
    users,
    meters,
    activeMeters,
    healthy,
    low,
    critical,
    alertsToday,
    checksToday,
    failedChecks,
    successfulToday,
  ] = await Promise.all([
    countRows("profiles"),
    countRows("meters"),
    countRows("meters").eq("monitoring_enabled", true),
    countRows("meters").eq("status", "healthy"),
    countRows("meters").eq("status", "low"),
    countRows("meters").eq("status", "critical"),
    countRows("alerts").gte("created_at", since),
    countRows("balance_readings").gte("checked_at", since),
    countRows("balance_readings")
      .eq("status", "failed")
      .gte("checked_at", since),
    countRows("balance_readings")
      .eq("status", "success")
      .gte("checked_at", since),
  ]);

  return {
    totalUsers: users.count ?? 0,
    totalMeters: meters.count ?? 0,
    activeMeters: activeMeters.count ?? 0,
    healthy: healthy.count ?? 0,
    low: low.count ?? 0,
    critical: critical.count ?? 0,
    alertsToday: alertsToday.count ?? 0,
    failedChecks: failedChecks.count ?? 0,
    checksToday: checksToday.count ?? 0,
    successfulChecksToday: successfulToday.count ?? 0,
  };
}

export async function getAllUsers(): Promise<ProfileWithStats[]> {
  if (!(await assertAdmin())) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*, meters(id)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin] getAllUsers failed:", error.message);
    return [];
  }

  type Row = ProfileWithStats & { meters: { id: string }[] | null };
  return ((data ?? []) as Row[]).map(({ meters, ...profile }) => ({
    ...profile,
    meter_count: meters?.length ?? 0,
  }));
}

export async function getAdmins(): Promise<ProfileWithStats[]> {
  const users = await getAllUsers();
  return users.filter((u) => u.role === "super_admin");
}

export async function getAllMeters(): Promise<MeterWithOwner[]> {
  if (!(await assertAdmin())) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("meters")
    .select("*, owner:profiles!meters_user_id_fkey(id, full_name, email)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin] getAllMeters failed:", error.message);
    return [];
  }
  return (data ?? []) as MeterWithOwner[];
}

export async function getAuditLogs(limit = 100): Promise<AuditLog[]> {
  if (!(await assertAdmin())) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[admin] getAuditLogs failed:", error.message);
    return [];
  }
  return (data ?? []) as AuditLog[];
}

export async function getSystemNotifications(
  limit = 50,
): Promise<Notification[]> {
  if (!(await assertAdmin())) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as Notification[];
}

export async function getSystemSettings(): Promise<SystemSetting[]> {
  if (!(await assertAdmin())) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .order("key");

  if (error) return [];
  return (data ?? []) as SystemSetting[];
}

/** Convenience map for reading individual settings by key. */
export async function getSettingsMap(): Promise<Record<string, string>> {
  const settings = await getSystemSettings();
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}

/**
 * 14-day check/alert volume for the admin analytics charts.
 * Buckets real rows by day; days with no rows report 0, which is a true value
 * here (zero checks happened) rather than fabricated data.
 */
export async function getVolumeSeries(days = 14): Promise<{
  checks: { date: string; success: number; failed: number }[];
  alerts: { date: string; low: number; critical: number }[];
}> {
  if (!(await assertAdmin())) return { checks: [], alerts: [] };

  const supabase = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setUTCHours(0, 0, 0, 0);

  const [readings, alerts] = await Promise.all([
    supabase
      .from("balance_readings")
      .select("checked_at, status")
      .gte("checked_at", since.toISOString()),
    supabase
      .from("alerts")
      .select("created_at, type")
      .gte("created_at", since.toISOString()),
  ]);

  const dayKeys: string[] = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    dayKeys.push(d.toISOString().slice(0, 10));
  }

  const checkMap = new Map(
    dayKeys.map((d) => [d, { date: d, success: 0, failed: 0 }]),
  );
  for (const row of (readings.data ?? []) as {
    checked_at: string;
    status: string;
  }[]) {
    const bucket = checkMap.get(row.checked_at.slice(0, 10));
    if (!bucket) continue;
    if (row.status === "failed") bucket.failed += 1;
    else bucket.success += 1;
  }

  const alertMap = new Map(
    dayKeys.map((d) => [d, { date: d, low: 0, critical: 0 }]),
  );
  for (const row of (alerts.data ?? []) as {
    created_at: string;
    type: string;
  }[]) {
    const bucket = alertMap.get(row.created_at.slice(0, 10));
    if (!bucket) continue;
    if (row.type === "critical_balance") bucket.critical += 1;
    else if (row.type === "low_balance") bucket.low += 1;
  }

  return {
    checks: [...checkMap.values()],
    alerts: [...alertMap.values()],
  };
}

/** A system-wide balance-check record joined with its meter and owner. */
export interface AdminLedgerReading {
  id: string;
  checkedAt: string;
  balance: number;
  status: ReadingStatus;
  meterName: string;
  ownerName: string | null;
  ownerEmail: string | null;
}

/** A system-wide alert record joined with its meter and owner. */
export interface AdminLedgerAlert {
  id: string;
  createdAt: string;
  type: AlertType;
  balance: number;
  threshold: number;
  status: AlertDeliveryStatus;
  meterName: string;
  ownerName: string | null;
  ownerEmail: string | null;
}

/**
 * Most recent balance checks across every account, for the admin ledger.
 * Owner identity is joined through the meter FK; nothing is fabricated — an
 * empty table returns an empty array.
 */
export async function getRecentReadings(
  limit = 50,
): Promise<AdminLedgerReading[]> {
  if (!(await assertAdmin())) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("balance_readings")
    .select(
      "id, checked_at, balance, status, meters!inner(name, owner:profiles!meters_user_id_fkey(full_name, email))",
    )
    .order("checked_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[admin] getRecentReadings failed:", error.message);
    return [];
  }

  type Row = {
    id: string;
    checked_at: string;
    balance: number;
    status: ReadingStatus;
    meters: {
      name: string;
      owner: { full_name: string | null; email: string } | null;
    } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    checkedAt: row.checked_at,
    balance: row.balance,
    status: row.status,
    meterName: row.meters?.name ?? "—",
    ownerName: row.meters?.owner?.full_name ?? null,
    ownerEmail: row.meters?.owner?.email ?? null,
  }));
}

/**
 * Most recent alerts across every account, for the admin ledger.
 * Owner identity is joined through the meter FK; an empty table returns [].
 */
export async function getRecentAlerts(limit = 50): Promise<AdminLedgerAlert[]> {
  if (!(await assertAdmin())) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("alerts")
    .select(
      "id, created_at, type, balance, threshold, status, meters!inner(name, owner:profiles!meters_user_id_fkey(full_name, email))",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[admin] getRecentAlerts failed:", error.message);
    return [];
  }

  type Row = {
    id: string;
    created_at: string;
    type: AlertType;
    balance: number;
    threshold: number;
    status: AlertDeliveryStatus;
    meters: {
      name: string;
      owner: { full_name: string | null; email: string } | null;
    } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    type: row.type,
    balance: row.balance,
    threshold: row.threshold,
    status: row.status,
    meterName: row.meters?.name ?? "—",
    ownerName: row.meters?.owner?.full_name ?? null,
    ownerEmail: row.meters?.owner?.email ?? null,
  }));
}

/**
 * Reports the SMTP relay configuration WITHOUT the password.
 *
 * `configured` is derived from the presence of the env vars. The password is
 * never read into a return value, never logged, and has no code path to the
 * browser — only the boolean and the non-secret fields cross that boundary.
 */
export async function getEmailGatewayStatus(): Promise<{
  configured: boolean;
  host: string | null;
  port: string | null;
  sender: string | null;
  senderName: string | null;
  username: string | null;
}> {
  if (!(await assertAdmin())) {
    return {
      configured: false,
      host: null,
      port: null,
      sender: null,
      senderName: null,
      username: null,
    };
  }

  const user = process.env.EMAIL_USER ?? null;
  const hasPassword = Boolean(process.env.EMAIL_PASS);

  return {
    configured: Boolean(user) && hasPassword,
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: process.env.SMTP_PORT ?? "587",
    sender: user,
    senderName: process.env.EMAIL_FROM_NAME ?? "DESCO Smart",
    // The username IS the sender address here; shown so an admin can confirm
    // which mailbox is wired up. Never the password.
    username: user,
  };
}
