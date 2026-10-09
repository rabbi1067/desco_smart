"use client";

import dynamic from "next/dynamic";
import type { MeterStatus } from "@/types";
import { PageSkeleton } from "@/components/shared/page-skeleton";

/**
 * Lazy admin chart suite — same reasoning as the user-side lazy charts:
 * Recharts stays out of the initial bundle and loads after the stat tiles.
 */
const Charts = dynamic(
  () => import("./admin-analytics-charts").then((m) => m.AdminAnalyticsCharts),
  { ssr: false, loading: () => <PageSkeleton /> },
);

export function AdminAnalyticsChartsLazy({
  checks,
  alerts,
  statusDistribution,
}: {
  checks: { date: string; success: number; failed: number }[];
  alerts: { date: string; low: number; critical: number }[];
  statusDistribution: { key: MeterStatus; value: number }[];
}) {
  return (
    <Charts
      checks={checks}
      alerts={alerts}
      statusDistribution={statusDistribution}
    />
  );
}
