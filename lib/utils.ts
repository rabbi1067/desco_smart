import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { APP_TIMEZONE } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as Bangladeshi Taka.
 * Returns an em dash for null/undefined so the UI never renders "৳null" or a
 * fabricated zero for a meter that has genuinely never been read.
 */
export function formatCurrency(
  value: number | null | undefined,
  options: { decimals?: boolean } = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: options.decimals ? 2 : 0,
    maximumFractionDigits: options.decimals ? 2 : 0,
  }).format(value);
  return `৳${formatted}`;
}

export function formatNumber(
  value: number | null | undefined,
  decimals = 0,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Renders a timestamp in Dhaka time, e.g. "10 Sep 2026, 12:27 AM". */
export function formatDateTime(
  value: string | Date | null | undefined,
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: APP_TIMEZONE,
  }).format(date);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  }).format(date);
}

/** Short axis label for charts, e.g. "07 Sep". */
export function formatChartDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: APP_TIMEZONE,
  }).format(date);
}

/**
 * Relative time ("8m ago", "2h ago"). Falls back to an absolute date beyond a
 * week, where "43d ago" stops being useful.
 */
export function formatRelativeTime(
  value: string | Date | null | undefined,
): string {
  if (!value) return "Never";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Never";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 0) return "Just now";
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

/** ISO date (YYYY-MM-DD) — the format DESCO's API expects for range params. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "U";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Escapes a value for CSV: wraps in quotes and doubles inner quotes.
 * Also neutralises formula-injection (=, +, -, @) which spreadsheet apps
 * would otherwise execute on open.
 */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function toCSV(rows: Record<string, unknown>[], headers: string[]): string {
  const head = headers.map(csvCell).join(",");
  const body = rows
    .map((row) => headers.map((h) => csvCell(row[h])).join(","))
    .join("\n");
  return `${head}\n${body}`;
}

/** Percentage of a bar/gauge, clamped to 0–100 so UI never overflows. */
export function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/**
 * Formats a 0–1 fraction as a percentage string, e.g. 0.937 → "94%".
 * Returns an em dash for a non-finite ratio (e.g. 0/0) rather than "NaN%".
 */
export function formatPercent(ratio: number | null | undefined, decimals = 0): string {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return "—";
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(ratio * 100)}%`;
}

export function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}
