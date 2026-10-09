"use client";

import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import type { AnalyticsData } from "@/types";

/**
 * Lazy chart suite — Recharts (+d3, ~300KB) loads only when charts actually
 * render, AFTER the page shell/tiles are already visible. Until then a
 * skeleton holds the layout so there is no shift.
 *
 * `ssr: false` is deliberate: charts are pure visualisation of already-fetched
 * data, so skipping server render saves CPU without changing content.
 */
const Charts = dynamic(
  () => import("./analytics-charts").then((m) => m.AnalyticsCharts),
  { ssr: false, loading: () => <PageSkeleton /> },
);

export function AnalyticsChartsLazy({
  data,
  threshold,
}: {
  data: AnalyticsData;
  threshold?: number;
}) {
  return <Charts data={data} threshold={threshold} />;
}
