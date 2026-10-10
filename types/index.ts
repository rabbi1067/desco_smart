/**
 * Domain types for DESCO Smart.
 *
 * These mirror the Supabase schema in `supabase/migrations/`. Keep the two in
 * sync — the DB is authoritative, this file is the compile-time contract.
 */

export type UserRole = "user" | "admin" | "super_admin";

/**
 * Lifecycle state of a meter, derived from balance vs. its thresholds.
 * `checking` / `error` / `disabled` are operational states, not balance states.
 */
export type MeterStatus =
  | "healthy"
  | "low"
  | "critical"
  | "checking"
  | "error"
  | "disabled";

export type AlertType = "low_balance" | "critical_balance" | "recovery";

export type AlertDeliveryStatus = "pending" | "sent" | "failed" | "skipped";

export type NotificationType =
  | "low_balance"
  | "critical_balance"
  | "recovery"
  | "system"
  | "monitoring_error";

export type ReadingSource = "scheduled" | "manual" | "import";

export type ReadingStatus = "success" | "failed";

export type ThemePreference = "light" | "dark" | "system";

export type Language = "en" | "bn";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  designation: string | null;
  language: Language;
  theme: ThemePreference;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Meter {
  id: string;
  user_id: string;
  name: string;
  meter_number: string;
  account_number: string;
  /** Balance at/below which a "low" alert fires. Per-meter, user configurable. */
  threshold: number;
  /** Balance at/below which a "critical" alert fires. Must be < threshold. */
  critical_threshold: number;
  current_balance: number | null;
  status: MeterStatus;
  monitoring_enabled: boolean;
  email_alert_enabled: boolean;
  alert_email?: string | null;
  last_checked_at: string | null;
  last_error: string | null;
  /** Metadata returned by DESCO (tariff, load, address). Read-only, synced. */
  customer_name: string | null;
  installation_address: string | null;
  tariff_solution: string | null;
  sanction_load: number | null;
  phase_type: string | null;
  current_month_consumption: number | null;
  reading_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface BalanceReading {
  id: string;
  meter_id: string;
  balance: number;
  /** DESCO's own reading timestamp, distinct from when we polled it. */
  reading_time: string | null;
  current_month_consumption: number | null;
  checked_at: string;
  source: ReadingSource;
  status: ReadingStatus;
  error_message: string | null;
}

export interface Alert {
  id: string;
  meter_id: string;
  user_id: string;
  type: AlertType;
  threshold: number;
  balance: number;
  status: AlertDeliveryStatus;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  meter_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  email_alerts: boolean;
  low_balance: boolean;
  critical_balance: boolean;
  recovery_alerts: boolean;
  daily_summary: boolean;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  actor_email: string | null;
  action: AuditAction;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  result: "success" | "failure";
  created_at: string;
}

export type AuditAction =
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "METER_CREATED"
  | "METER_UPDATED"
  | "METER_DELETED"
  | "BALANCE_CHECK"
  | "ALERT_SENT"
  | "SETTINGS_UPDATED"
  | "NOTIFICATION_READ"
  | "LOGIN"
  | "LOGOUT";

export interface SystemSetting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export interface SmtpSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromName: string;
  secure: boolean;
  enabled: boolean;
  configured: boolean;
  hasPassword?: boolean;
}

/** A meter joined with its owner — used only in Super Admin views. */
export interface MeterWithOwner extends Meter {
  owner: Pick<Profile, "id" | "full_name" | "email"> | null;
}

/** A profile augmented with aggregate counts for the admin users directory. */
export interface ProfileWithStats extends Profile {
  meter_count: number;
}

export interface FleetSummary {
  total: number;
  healthy: number;
  low: number;
  critical: number;
  disabled: number;
  error: number;
  totalBalance: number;
}

export interface AdminSystemStats {
  totalUsers: number;
  totalMeters: number;
  activeMeters: number;
  healthy: number;
  low: number;
  critical: number;
  alertsToday: number;
  failedChecks: number;
  checksToday: number;
  successfulChecksToday: number;
}

/** Point in the balance-over-time series. */
export interface BalancePoint {
  date: string;
  balance: number;
}

/** Point in the daily-consumption series (taka burned that day). */
export interface ConsumptionPoint {
  date: string;
  consumed: number;
}

export interface RechargeRecord {
  orderId: string;
  rechargeDate: string;
  totalAmount: number;
  energyAmount: number;
  vat: number;
  status: string;
  tariff: string | null;
}

export interface AnalyticsData {
  balanceHistory: BalancePoint[];
  consumption: ConsumptionPoint[];
  recharges: RechargeRecord[];
  averageDailyUsage: number | null;
  highestUsage: number | null;
  lowestUsage: number | null;
  rechargeCount: number;
  estimatedRunoutDate: string | null;
  remainingDays: number | null;
  currentBalance: number | null;
  /** True when there is genuinely nothing to plot, so the UI shows an empty state. */
  isEmpty: boolean;
}

export type AnalyticsPeriod = "7d" | "14d" | "30d" | "custom";

/** The three report views on the Reports page. */
export type ReportType = "balance_history" | "alert_history" | "meter_health";

/**
 * Validated report query, as consumed by `lib/services/reports.ts`.
 * Mirrors `reportFilterSchema`; `meterId`/`status` are optional narrowing
 * filters (empty string means "no filter").
 */
export interface ReportFilters {
  type: ReportType;
  meterId?: string;
  dateFrom: string;
  dateTo: string;
  status?: string;
}

/** Uniform result wrapper for every server action, so the UI can branch safely. */
export type ActionResult<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
