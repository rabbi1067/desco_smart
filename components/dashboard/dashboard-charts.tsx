"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  Zap,
  ArrowRight,
  BatteryCharging,
  Gauge,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { RechargeModal } from "@/components/shared/recharge-modal";
import { resolveDisplayStatus } from "@/lib/constants";
import { formatCurrency, formatChartDate } from "@/lib/utils";
import type { AnalyticsData, Meter } from "@/types";

const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  primaryFill: "hsl(var(--primary) / 0.15)",
  secondary: "hsl(var(--chart-2, 215 90% 55%))",
  secondaryFill: "hsl(var(--chart-2, 215 90% 55%) / 0.15)",
  warning: "hsl(var(--status-low, 38 92% 50%))",
  critical: "hsl(var(--destructive))",
  grid: "hsl(var(--border) / 0.5)",
  axis: "hsl(var(--muted-foreground))",
};

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.625rem",
  color: "hsl(var(--card-foreground))",
  fontSize: "0.8125rem",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
  padding: "8px 12px",
};

export function DashboardCharts({
  analytics,
  meters = [],
}: {
  analytics: AnalyticsData;
  meters: Meter[];
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(false);
    const timer = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const balancePoints = analytics.balanceHistory.map((p) => ({
    date: formatChartDate(p.date),
    balance: Math.round(p.balance * 100) / 100,
  }));

  const consumptionPoints = analytics.consumption.map((c) => ({
    date: formatChartDate(c.date),
    consumed: Math.round(c.consumed * 100) / 100,
  }));

  const hasBalanceChart = balancePoints.length > 0;
  const hasConsumptionChart = consumptionPoints.length > 0;

  // Calculate average low threshold across meters to show on balance chart
  const validThresholds = meters.filter((m) => m.threshold > 0);
  const avgThreshold =
    validThresholds.length > 0
      ? Math.round(
          validThresholds.reduce((sum, m) => sum + m.threshold, 0) /
            validThresholds.length,
        )
      : null;

  return (
    <div className="space-y-6">
      {/* Visual Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Balance Trend Area Chart */}
        <Card className="flex flex-col shadow-sm border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <TrendingUp className="size-4 text-primary" />
                  Balance Trajectory
                </CardTitle>
                <CardDescription className="text-xs">
                  Recorded prepaid electricity balance progression
                </CardDescription>
              </div>
              {analytics.currentBalance !== null && (
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">
                    Current Total
                  </span>
                  <span className="font-bold text-foreground tabular">
                    {formatCurrency(analytics.currentBalance)}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 pb-4">
            {!mounted ? (
              <div className="h-64 w-full animate-pulse rounded-lg bg-muted/40" />
            ) : hasBalanceChart ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={balancePoints}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke={CHART_COLORS.axis}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={5}
                    />
                    <YAxis
                      stroke={CHART_COLORS.axis}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `৳${v}`}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(val: number) => [formatCurrency(val), "Balance"]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    {avgThreshold && (
                      <ReferenceLine
                        y={avgThreshold}
                        stroke={CHART_COLORS.warning}
                        strokeDasharray="4 4"
                        label={{
                          value: `Low Limit: ৳${avgThreshold}`,
                          fill: CHART_COLORS.warning,
                          fontSize: 10,
                          position: "top",
                        }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#balanceGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border/70 p-6 text-center">
                <Gauge className="size-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium text-foreground">
                  Balance tracking underway
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Historical trajectory builds as background checks poll your meter.
                  Current balance is monitored 24/7.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Burn Rate / Consumption Chart */}
        <Card className="flex flex-col shadow-sm border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Zap className="size-4 text-amber-500" />
                  Daily Burn Rate
                </CardTitle>
                <CardDescription className="text-xs">
                  Daily electricity consumption in Taka (BDT)
                </CardDescription>
              </div>
              {analytics.averageDailyUsage !== null && (
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">
                    Avg Burn / Day
                  </span>
                  <span className="font-bold text-foreground tabular">
                    ৳{analytics.averageDailyUsage.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 pb-4">
            {!mounted ? (
              <div className="h-64 w-full animate-pulse rounded-lg bg-muted/40" />
            ) : hasConsumptionChart ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={consumptionPoints}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke={CHART_COLORS.axis}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={5}
                    />
                    <YAxis
                      stroke={CHART_COLORS.axis}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `৳${v}`}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(val: number) => [formatCurrency(val), "Consumed"]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Bar
                      dataKey="consumed"
                      fill="hsl(var(--chart-3, 38 92% 50%))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border/70 p-6 text-center">
                <BatteryCharging className="size-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium text-foreground">
                  Consumption statistics synchronizing
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Daily burn breakdown updates from the DESCO server automatically.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Connected Meters Live Status & Quick Action Cards */}
      {meters.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                Connected Meter Fleet
              </h3>
              <p className="text-xs text-muted-foreground">
                Real-time balance, threshold health bars, and quick recharge access
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
              <Link href="/meters">
                Manage Meters
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meters.map((meter) => {
              const displayStatus = resolveDisplayStatus(meter);
              const balance = meter.current_balance ?? 0;
              const threshold = meter.threshold || 500;
              const criticalThreshold = meter.critical_threshold || 100;

              // Health percentage: relative to 2x threshold for clean visual gauge
              const gaugeMax = Math.max(threshold * 2, 1000);
              const gaugePercent = Math.min(Math.round((balance / gaugeMax) * 100), 100);

              const isCritical = displayStatus === "critical" || balance <= criticalThreshold;
              const isLow = !isCritical && (displayStatus === "low" || balance <= threshold);

              return (
                <Card
                  key={meter.id}
                  className={`relative overflow-hidden transition-all duration-200 hover:shadow-md border ${
                    isCritical
                      ? "border-destructive/60 bg-destructive/5"
                      : isLow
                      ? "border-amber-500/50 bg-amber-500/5"
                      : "border-border/80 bg-card"
                  }`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/meters/${meter.id}`}
                          className="font-semibold text-sm hover:underline block truncate"
                        >
                          {meter.name}
                        </Link>
                        <p className="text-xs text-muted-foreground tabular font-mono">
                          Meter: {meter.meter_number}
                        </p>
                      </div>
                      <StatusBadge status={displayStatus} />
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-3">
                    {/* Big Balance Callout */}
                    <div className="flex items-baseline justify-between border-b border-border/40 pb-2.5">
                      <div>
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                          Prepaid Balance
                        </span>
                        <span
                          className={`text-xl font-extrabold tracking-tight tabular ${
                            isCritical
                              ? "text-destructive"
                              : isLow
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-foreground"
                          }`}
                        >
                          {formatCurrency(meter.current_balance)}
                        </span>
                      </div>
                      <div className="text-right text-[11px] text-muted-foreground">
                        <span>Limit: ৳{threshold}</span>
                      </div>
                    </div>

                    {/* Balance Gauge Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Threshold Gauge</span>
                        <span>{gaugePercent}% safe</span>
                      </div>
                      <Progress
                        value={gaugePercent}
                        indicatorClassName={
                          isCritical
                            ? "bg-destructive"
                            : isLow
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }
                        className="h-1.5"
                      />
                    </div>

                    {/* Quick Action Footer */}
                    <div className="flex items-center gap-2 pt-1">
                      <RechargeModal
                        meters={[
                          {
                            id: meter.id,
                            name: meter.name,
                            meterNumber: meter.meter_number,
                            accountNumber: meter.account_number,
                            currentBalance: meter.current_balance,
                          },
                        ]}
                        selectedMeterId={meter.id}
                        trigger={
                          <Button
                            variant={isCritical ? "destructive" : isLow ? "default" : "outline"}
                            size="sm"
                            className="flex-1 h-8 gap-1.5 text-xs font-semibold shadow-xs"
                          >
                            <Zap className="size-3.5" />
                            Recharge
                          </Button>
                        }
                      />

                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Link href={`/meters/${meter.id}`}>
                          <span>Details</span>
                          <ArrowRight className="size-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
