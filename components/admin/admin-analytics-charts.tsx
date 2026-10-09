"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatChartDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { MeterStatus } from "@/types";

const CHART = {
  grid: "hsl(var(--border))",
  axis: "hsl(var(--muted-foreground))",
  success: "hsl(var(--chart-1))",
  failed: "hsl(var(--chart-5))",
  low: "hsl(var(--status-low))",
  critical: "hsl(var(--status-critical))",
  healthy: "hsl(var(--status-healthy))",
};

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.5rem",
  color: "hsl(var(--popover-foreground))",
  fontSize: "0.8125rem",
} as const;

const axisProps = {
  stroke: CHART.axis,
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;

/**
 * System-wide analytics charts (admin only).
 *
 * All series are real counts bucketed by day on the server; a day with no
 * activity is a true 0, not fabricated data. Each chart guards for an all-empty
 * dataset and shows a muted note instead of an empty axis frame.
 */
export function AdminAnalyticsCharts({
  checks,
  alerts,
  statusDistribution,
}: {
  checks: { date: string; success: number; failed: number }[];
  alerts: { date: string; low: number; critical: number }[];
  statusDistribution: { key: MeterStatus; value: number }[];
}) {
  const { t } = useTranslation();

  const checkSeries = checks.map((c) => ({
    date: formatChartDate(c.date),
    success: c.success,
    failed: c.failed,
  }));
  const alertSeries = alerts.map((a) => ({
    date: formatChartDate(a.date),
    low: a.low,
    critical: a.critical,
  }));
  const pieData = statusDistribution
    .filter((s) => s.value > 0)
    .map((s) => ({ name: t(`status.${s.key}` as const), value: s.value, key: s.key }));

  const hasChecks = checkSeries.some((c) => c.success > 0 || c.failed > 0);
  const hasAlerts = alertSeries.some((a) => a.low > 0 || a.critical > 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title={t("admin.analytics.checkVolume")}>
        {hasChecks ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={checkSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" {...axisProps} minTickGap={16} />
              <YAxis {...axisProps} width={36} allowDecimals={false} />
              <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.4)" }} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <Bar name={t("admin.analytics.successfulChecks")} dataKey="success" stackId="c" fill={CHART.success} radius={[0, 0, 0, 0]} maxBarSize={28} />
              <Bar name={t("admin.analytics.failedChecks")} dataKey="failed" stackId="c" fill={CHART.failed} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <NoData label={t("analytics.noData")} />
        )}
      </ChartCard>

      <ChartCard title={t("admin.analytics.alertVolume")}>
        {hasAlerts ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={alertSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" {...axisProps} minTickGap={16} />
              <YAxis {...axisProps} width={36} allowDecimals={false} />
              <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.4)" }} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <Bar name={t("admin.analytics.lowAlerts")} dataKey="low" stackId="a" fill={CHART.low} radius={[0, 0, 0, 0]} maxBarSize={28} />
              <Bar name={t("admin.analytics.criticalAlerts")} dataKey="critical" stackId="a" fill={CHART.critical} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <NoData label={t("analytics.noData")} />
        )}
      </ChartCard>

      <ChartCard title={t("admin.analytics.metersByStatus")} className="lg:col-span-2">
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {pieData.map((entry) => (
                  <Cell key={entry.key} fill={CHART[entry.key as "healthy" | "low" | "critical"] ?? CHART.axis} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <NoData label={t("analytics.noData")} />
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${className ?? ""}`}>
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function NoData({ label }: { label: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
