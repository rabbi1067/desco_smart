"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  clampPercent,
  formatChartDate,
  formatCurrency,
} from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { AnalyticsData } from "@/types";

/**
 * Recharts colour palette bound to the design tokens, so charts recolour with
 * the theme (light/dark) automatically. Recharts needs concrete colour strings,
 * so we read the CSS custom properties into `hsl(var(--…))` wrappers.
 */
const CHART = {
  primary: "hsl(var(--chart-1))",
  blue: "hsl(var(--chart-2))",
  amber: "hsl(var(--chart-3))",
  purple: "hsl(var(--chart-4))",
  red: "hsl(var(--chart-5))",
  grid: "hsl(var(--border))",
  axis: "hsl(var(--muted-foreground))",
  threshold: "hsl(var(--status-low))",
};

const PIE_COLORS = [CHART.primary, CHART.blue, CHART.amber, CHART.purple, CHART.red];

/** Shared tooltip styling so every chart's popover matches the card surface. */
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
 * The full analytics chart suite for a meter or the fleet.
 *
 * Every chart guards its own data: a chart with no usable series renders a
 * muted "no data" note rather than an empty axis box, honouring the
 * no-fabricated-data rule. The parent decides whether to show the suite at all
 * (via `AnalyticsData.isEmpty`); these guards handle partial data (e.g. balance
 * history present but DESCO consumption unavailable).
 */
export function AnalyticsCharts({
  data,
  threshold,
}: {
  data: AnalyticsData;
  /** Low-balance threshold to draw as a reference line, when charting one meter. */
  threshold?: number;
}) {
  const { t } = useTranslation();

  const balanceSeries = data.balanceHistory.map((point) => ({
    date: formatChartDate(point.date),
    balance: point.balance,
  }));

  const consumptionSeries = data.consumption.map((point) => ({
    date: formatChartDate(point.date),
    consumed: point.consumed,
  }));

  // Weekly comparison, computed client-side from the consumption series — the
  // server helper lives in a `server-only` module and can't be imported here.
  const weeklyComparison = buildWeeklyComparison(data);

  // Day-band ratio from consumption for the share pie.
  const ratioData = buildDayBands(data);

  const capacityPercent =
    threshold && threshold > 0 && data.currentBalance !== null
      ? clampPercent((data.currentBalance / (threshold * 2)) * 100)
      : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* 1 — Balance trajectory (line) */}
      <ChartCard title={t("analytics.chart1")} description={t("analytics.chart1desc")}>
        {balanceSeries.length > 1 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={balanceSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" {...axisProps} minTickGap={24} />
              <YAxis {...axisProps} width={48} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [formatCurrency(value), t("meters.balance")]}
              />
              {threshold ? (
                <ReferenceLine
                  y={threshold}
                  stroke={CHART.threshold}
                  strokeDasharray="4 4"
                  label={{ value: t("meters.threshold"), position: "insideTopRight", fill: CHART.axis, fontSize: 11 }}
                />
              ) : null}
              <Line
                type="monotone"
                dataKey="balance"
                stroke={CHART.primary}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <NoData label={t("analytics.noData")} />
        )}
      </ChartCard>

      {/* 2 — Balance as volume (area) */}
      <ChartCard title={t("analytics.chart2")} description={t("analytics.chart2desc")}>
        {balanceSeries.length > 1 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={balanceSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART.primary} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={CHART.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" {...axisProps} minTickGap={24} />
              <YAxis {...axisProps} width={48} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [formatCurrency(value), t("meters.balance")]}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke={CHART.primary}
                strokeWidth={2}
                fill="url(#balanceFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <NoData label={t("analytics.noData")} />
        )}
      </ChartCard>

      {/* 3 — Daily burn rate (bar) */}
      <ChartCard title={t("analytics.chart3")} description={t("analytics.chart3desc")}>
        {consumptionSeries.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={consumptionSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" {...axisProps} minTickGap={16} />
              <YAxis {...axisProps} width={48} />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                contentStyle={tooltipStyle}
                formatter={(value: number) => [formatCurrency(value), t("analytics.chart3")]}
              />
              <Bar dataKey="consumed" fill={CHART.amber} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <NoData label={t("analytics.dataSource")} />
        )}
      </ChartCard>

      {/* 4 — Weekly comparison (grouped bar) */}
      <ChartCard title={t("analytics.chart4")} description={t("analytics.chart4desc")}>
        {weeklyComparison.some((d) => d.thisWeek !== null || d.lastWeek !== null) ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weeklyComparison} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="day" {...axisProps} />
              <YAxis {...axisProps} width={48} />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                contentStyle={tooltipStyle}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <Bar name={t("analytics.thisWeek")} dataKey="thisWeek" fill={CHART.primary} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar name={t("analytics.lastWeek")} dataKey="lastWeek" fill={CHART.blue} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <NoData label={t("analytics.dataSource")} />
        )}
      </ChartCard>

      {/* 5 — Consumption ratio by day band (pie) */}
      <ChartCard title={t("analytics.chart5")} description={t("analytics.chart5desc")}>
        {ratioData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={ratioData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {ratioData.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <NoData label={t("analytics.dataSource")} />
        )}
      </ChartCard>

      {/* 6 — Balance capacity vs threshold (radial) */}
      <ChartCard title={t("analytics.chart6")} description={t("analytics.chart6desc")}>
        {capacityPercent !== null ? (
          <div className="relative">
            <ResponsiveContainer width="100%" height={260}>
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={[{ name: t("meters.balance"), value: capacityPercent, fill: CHART.primary }]}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={12} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular">
                {formatCurrency(data.currentBalance)}
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round(capacityPercent)}% {t("analytics.capacityLabel")}
              </span>
            </div>
          </div>
        ) : (
          <NoData label={t("analytics.noData")} />
        )}
      </ChartCard>

      {/* 7 — Activity intensity (area, consumption) */}
      <ChartCard
        title={t("analytics.chart7")}
        description={t("analytics.chart7desc")}
        className="lg:col-span-2"
      >
        {consumptionSeries.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={consumptionSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="intensityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART.purple} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={CHART.purple} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" {...axisProps} minTickGap={16} />
              <YAxis {...axisProps} width={48} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [formatCurrency(value), t("analytics.chart3")]}
              />
              <Area
                type="monotone"
                dataKey="consumed"
                stroke={CHART.purple}
                strokeWidth={2}
                fill="url(#intensityFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <NoData label={t("analytics.dataSource")} />
        )}
      </ChartCard>
    </div>
  );
}

/** Groups consumption into day bands (early/mid/late in the period) for the pie. */
function buildDayBands(data: AnalyticsData): { name: string; value: number }[] {
  const points = data.consumption.filter((c) => c.consumed > 0);
  if (points.length === 0) return [];
  const third = Math.ceil(points.length / 3) || 1;
  const bands = [
    { name: "Early", value: 0 },
    { name: "Mid", value: 0 },
    { name: "Late", value: 0 },
  ];
  points.forEach((point, index) => {
    const band = Math.min(2, Math.floor(index / third));
    bands[band].value += point.consumed;
  });
  return bands.filter((b) => b.value > 0);
}

/**
 * Splits the consumption series into this-week / last-week day pairs. Mirrors
 * the server helper of the same name; kept here because charts are client-only
 * and the server module is `server-only`. Missing days stay null (line gap),
 * never 0.
 */
function buildWeeklyComparison(
  data: AnalyticsData,
): { day: string; thisWeek: number | null; lastWeek: number | null }[] {
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

  const thisWeek = new Array<number | null>(7).fill(null);
  const lastWeek = new Array<number | null>(7).fill(null);

  for (const point of data.consumption) {
    const date = new Date(`${point.date}T00:00:00+06:00`);
    if (Number.isNaN(date.getTime())) continue;
    if (date >= startOfThisWeek) {
      thisWeek[date.getDay()] = point.consumed;
    } else if (date >= startOfLastWeek) {
      lastWeek[date.getDay()] = point.consumed;
    }
  }

  return DAY_LABELS.map((day, index) => ({
    day,
    thisWeek: thisWeek[index],
    lastWeek: lastWeek[index],
  }));
}

function ChartCard({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${className ?? ""}`}>
      <div className="mb-4 space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function NoData({ label }: { label: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
