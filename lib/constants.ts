import type { MeterStatus } from "@/types";

/**
 * Central business rules for DESCO Smart.
 *
 * Every threshold/status decision in the app (and in the Python worker, which
 * mirrors these values in `monitor/config.py`) resolves through here. Do not
 * inline numeric thresholds in components — import from this module instead.
 */

/** Fallback thresholds applied when a meter does not specify its own. */
export const DEFAULT_LOW_THRESHOLD = 300;
export const DEFAULT_CRITICAL_THRESHOLD = 100;

export const MIN_THRESHOLD = 0;
export const MAX_THRESHOLD = 100_000;

/**
 * Alert de-duplication window.
 *
 * Policy: while a meter stays in the same alert state, we re-notify at most
 * once per cooldown window (24 hours). A *state change* (healthy→low, low→critical, or
 * recovery) always notifies immediately, bypassing the cooldown. This stops the
 * "same email every scheduled run" problem without hiding genuine escalation.
 */
export const ALERT_COOLDOWN_HOURS = 24;

/**
 * Hysteresis buffer for recovery, expressed as a fraction of the threshold.
 * A meter must climb above `threshold * (1 + RECOVERY_BUFFER)` before we call
 * it recovered — prevents flapping when the balance hovers at the boundary.
 */
export const RECOVERY_BUFFER = 0.05;

/**
 * Derives a meter's balance status from its thresholds.
 *
 * Rules (inclusive comparisons, matching the original Python `balance <= THRESHOLD`):
 *   balance <= critical_threshold        → critical
 *   balance <= threshold                 → low
 *   otherwise                            → healthy
 */
export function deriveStatus(
  balance: number | null | undefined,
  threshold: number,
  criticalThreshold: number,
): MeterStatus {
  if (balance === null || balance === undefined || Number.isNaN(balance)) {
    return "error";
  }
  if (balance <= criticalThreshold) return "critical";
  if (balance <= threshold) return "low";
  return "healthy";
}

/**
 * Resolves the status shown in the UI, accounting for monitoring being off.
 * A disabled meter reports `disabled` regardless of its last known balance.
 */
export function resolveDisplayStatus(meter: {
  status: MeterStatus;
  monitoring_enabled: boolean;
}): MeterStatus {
  if (!meter.monitoring_enabled) return "disabled";
  return meter.status;
}

export const STATUS_ORDER: MeterStatus[] = [
  "critical",
  "low",
  "error",
  "healthy",
  "checking",
  "disabled",
];

/** Sort helper so the most urgent meters surface first in any list. */
export function compareByUrgency(a: MeterStatus, b: MeterStatus): number {
  return STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b);
}

/**
 * Estimates days of runway from a balance and an average daily burn rate.
 * Returns null when the burn rate is unusable (zero/negative/unknown), rather
 * than fabricating an optimistic number.
 */
export function estimateRemainingDays(
  balance: number | null,
  averageDailyUsage: number | null,
): number | null {
  if (balance === null || averageDailyUsage === null) return null;
  if (averageDailyUsage <= 0) return null;
  if (balance <= 0) return 0;
  return Math.round((balance / averageDailyUsage) * 10) / 10;
}

/** Pagination defaults for admin tables and report views. */
export const PAGE_SIZE = 10;
export const ADMIN_PAGE_SIZE = 15;

/** Supported analytics windows, in days. `custom` is handled separately. */
export const PERIOD_DAYS: Record<"7d" | "14d" | "30d", number> = {
  "7d": 7,
  "14d": 14,
  "30d": 30,
};

export const APP_TIMEZONE = "Asia/Dhaka";

export const DESCO_API_BASE =
  "https://prepaid.desco.org.bd/api/tkdes/customer";

/** Matches the 30s timeout used by the original `desco_check.py` request. */
export const DESCO_REQUEST_TIMEOUT_MS = 30_000;

/**
 * Server-side cache windows for DESCO *historical* reads (Next.js fetch
 * `revalidate`, in seconds). These endpoints describe the past, so serving a
 * recent cached copy makes charts load instantly and shields the upstream API
 * from repeat traffic. Live balance is deliberately excluded — it is always
 * fetched fresh (`cache: "no-store"`) so an alert never fires on stale data.
 */
export const DESCO_DAILY_CACHE_SECONDS = 900; // 15 min
export const DESCO_MONTHLY_CACHE_SECONDS = 3_600; // 1 hour
export const DESCO_RECHARGE_CACHE_SECONDS = 900; // 15 min

/**
 * Image upload rules (Cloudinary). Enforced server-side in the upload action,
 * regardless of any client-side check.
 */
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
/** Base Cloudinary folder for all app assets. */
export const CLOUDINARY_UPLOAD_FOLDER = "desco-smart";
/** Sub-folder for user avatars. */
export const CLOUDINARY_AVATAR_FOLDER = "desco-smart/avatars";

/** Official developer/social links used in the footer. */
export const SOCIAL_LINKS = {
  linkedin: "https://www.linkedin.com/in/fazleyrabbi1067/",
  github: "https://github.com/rabbi1067",
  x: "https://x.com/FazleRabbi56251",
  facebook: "https://www.facebook.com/fazleyrabbi1067/",
} as const;

export const SOURCE_REPO = "https://github.com/rabbi1067/desco-balance-alert";
