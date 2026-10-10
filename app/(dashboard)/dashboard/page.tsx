import type { Metadata } from "next";
import Link from "next/link";
import {
  Gauge,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wallet,
  Plus,
  Activity,
  ArrowRight,
  Zap,
  TrendingDown,
  Calendar,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { getServerTranslator } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/auth";
import {
  getMeters,
  summariseFleet,
  filterNeedsAttention,
  getRecentReadings,
} from "@/lib/services/meters";
import { getFleetAnalytics } from "@/lib/services/analytics";
import { resolveDisplayStatus } from "@/lib/constants";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { RechargeModal } from "@/components/shared/recharge-modal";
import { TariffEstimator } from "@/components/dashboard/tariff-estimator";
import { RechargeHub } from "@/components/dashboard/recharge-hub";
import { QuickConnectMeter } from "@/components/dashboard/quick-connect-meter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const { t } = await getServerTranslator();

  // Fetch meters, profile, recent readings, and analytics in parallel
  const [profile, meters, recent, analytics] = await Promise.all([
    getCurrentProfile(),
    getMeters(),
    getRecentReadings(8),
    getFleetAnalytics("30d"),
  ]);

  const summary = summariseFleet(meters);
  const needsAttention = filterNeedsAttention(meters);

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? "";

  const criticalMeters = needsAttention.filter(
    (m) => resolveDisplayStatus(m) === "critical",
  );
  const lowMeters = needsAttention.filter(
    (m) => resolveDisplayStatus(m) === "low",
  );

  const rechargeMeterOptions = meters.map((m) => ({
    id: m.id,
    name: m.name,
    meterNumber: m.meter_number,
    accountNumber: m.account_number,
    currentBalance: m.current_balance,
  }));

  return (
    <div className="space-y-8">
      {/* Page Header with Real-time Status and Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {firstName ? `${t("dash.welcome")}, ${firstName}` : "Executive Energy Hub"}
            </h1>
            <Badge variant="healthy" className="gap-1 text-[10px] font-semibold">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Gateway Active
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            24/7 Automated DESCO Prepaid Telemetry, Tariff Estimator & Smart Balance Guard
          </p>
        </div>

        <div className="flex items-center gap-2">
          {meters.length > 0 && (
            <RechargeModal
              meters={rechargeMeterOptions}
              trigger={
                <Button variant="default" className="gap-2 bg-primary font-semibold shadow-sm">
                  <Zap className="size-4" />
                  Quick Recharge
                </Button>
              }
            />
          )}

          <Button asChild variant={meters.length === 0 ? "default" : "outline"} className="gap-1.5 font-semibold">
            <Link href="/meters">
              <Plus className="size-4" />
              {t("dash.addMeter")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Critical/Low Balance Alerts (When meters are connected and need attention) */}
      {criticalMeters.length > 0 ? (
        <div className="rounded-xl border border-destructive bg-destructive/10 p-4 text-destructive-foreground shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-destructive/20 p-2 text-destructive shrink-0">
                <XCircle className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-destructive dark:text-red-400">
                  CRITICAL ALERT: Emergency Recharge Required!
                </h3>
                <p className="text-xs text-destructive/90 dark:text-red-300 mt-0.5">
                  {criticalMeters.length} meter(s) reached critical threshold (
                  {criticalMeters.map((m) => `${m.name}: ৳${m.current_balance ?? 0}`).join(", ")}
                  ). Electricity disconnection is imminent.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <RechargeModal
                meters={rechargeMeterOptions}
                selectedMeterId={criticalMeters[0]?.id}
                trigger={
                  <Button variant="destructive" size="sm" className="w-full gap-1.5 font-bold shadow">
                    <Zap className="size-4" />
                    Recharge Immediately
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      ) : lowMeters.length > 0 ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-500/20 p-2 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                  Attention: Low Balance Detected
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  {lowMeters.length} meter(s) below low-balance limit (
                  {lowMeters.map((m) => `${m.name}: ৳${m.current_balance ?? 0}`).join(", ")}
                  ). Consider topping up soon to prevent service interruption.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <RechargeModal
                meters={rechargeMeterOptions}
                selectedMeterId={lowMeters[0]?.id}
                trigger={
                  <Button variant="default" size="sm" className="w-full gap-1.5 font-semibold bg-amber-600 hover:bg-amber-700 text-white">
                    <Zap className="size-4" />
                    Top-up Balance
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      ) : meters.length > 0 ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">
            All connected meters are healthy and operating normally with automated monitoring active.
          </span>
        </div>
      ) : null}

      {/* Core Executive KPI Cards - ALWAYS VISIBLE */}
      <section
        aria-label="Executive KPI Overview"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <StatCard
          icon={Wallet}
          label="Total Monitored Balance"
          value={meters.length > 0 ? formatCurrency(summary.totalBalance) : "৳0.00"}
          hint={meters.length > 0 ? `${meters.length} active meter${meters.length > 1 ? "s" : ""}` : "No meters linked"}
          tone="primary"
        />
        <StatCard
          icon={Gauge}
          label="Active Fleet Meters"
          value={String(meters.length)}
          hint={
            meters.length > 0
              ? `${summary.healthy} healthy, ${summary.low + summary.critical} alert(s)`
              : "0 connected • Ready"
          }
          tone={summary.critical > 0 ? "critical" : summary.low > 0 ? "low" : "healthy"}
        />
        <StatCard
          icon={TrendingDown}
          label="Avg Daily Burn Rate"
          value={
            analytics.averageDailyUsage !== null
              ? `৳${analytics.averageDailyUsage.toFixed(2)}`
              : "৳0.00"
          }
          hint={meters.length > 0 ? "Calculated daily spend" : "Awaiting meter sync"}
          tone="primary"
        />
        <StatCard
          icon={Calendar}
          label="Estimated Runway"
          value={
            analytics.remainingDays !== null && analytics.remainingDays > 0
              ? `${Math.floor(analytics.remainingDays)} Days`
              : meters.length > 0
              ? "Safe"
              : "Standby"
          }
          hint={
            analytics.estimatedRunoutDate
              ? `Until ~${new Date(analytics.estimatedRunoutDate).toLocaleDateString()}`
              : "24/7 Smart Alert Guard"
          }
          tone={
            analytics.remainingDays !== null && analytics.remainingDays <= 3
              ? "critical"
              : analytics.remainingDays !== null && analytics.remainingDays <= 7
              ? "low"
              : "healthy"
          }
        />
      </section>

      {/* When 0 meters are connected: Show Instant Connect Card */}
      {meters.length === 0 && (
        <QuickConnectMeter />
      )}

      {/* Interactive Charts & Gauges (if meters > 0) */}
      {meters.length > 0 && (
        <DashboardCharts analytics={analytics} meters={meters} />
      )}

      {/* Needs Attention & Recent History Activity Row (When meters are connected) */}
      {meters.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Needs Attention list */}
          <Card className="lg:col-span-2 border-border/80 shadow-sm">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <AlertTriangle
                    className="size-4 text-amber-500"
                    aria-hidden="true"
                  />
                  {t("dash.needsAttention")}
                </CardTitle>
                <CardDescription className="text-xs">
                  Meters approaching or past configured balance limits
                </CardDescription>
              </div>
              {needsAttention.length > 0 && (
                <Button asChild variant="ghost" size="sm" className="text-xs">
                  <Link href="/meters">
                    {t("dash.viewAll")}
                    <ArrowRight className="size-3.5 ml-1" aria-hidden="true" />
                  </Link>
                </Button>
              )}
            </CardHeader>

            <CardContent>
              {needsAttention.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title={t("empty.noAlerts")}
                  description={t("empty.noAlertsDesc")}
                  compact
                />
              ) : (
                <ul className="divide-y divide-border/60">
                  {needsAttention.map((meter) => (
                    <li key={meter.id} className="py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          href={`/meters/${meter.id}`}
                          className="min-w-0 flex-1 hover:underline"
                        >
                          <p className="truncate font-semibold text-sm text-foreground">
                            {meter.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground tabular">
                            Meter: {meter.meter_number} • Limit: ৳{meter.threshold}
                          </p>
                        </Link>

                        <div className="flex shrink-0 items-center gap-3">
                          <span className="tabular text-sm font-bold text-destructive">
                            {formatCurrency(meter.current_balance)}
                          </span>
                          <StatusBadge status={resolveDisplayStatus(meter)} />
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
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1">
                                <Zap className="size-3 text-amber-500" />
                                Recharge
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Recent DESCO poll history */}
          <Card className="lg:col-span-1 border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Activity className="size-4 text-primary" aria-hidden="true" />
                {t("dash.recentActivity")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("dash.recentActivityDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title={t("empty.noHistory")}
                  description={t("empty.noHistoryDesc")}
                  compact
                />
              ) : (
                <ul className="space-y-3">
                  {recent.map((reading) => (
                    <li
                      key={reading.id}
                      className="flex items-center justify-between gap-3 border-b border-border/40 pb-2 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {reading.meter_name}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="size-3" />
                          {formatRelativeTime(reading.checked_at)}
                        </p>
                      </div>
                      <span
                        className={
                          reading.status === "failed"
                            ? "shrink-0 text-xs font-medium text-destructive"
                            : "shrink-0 tabular text-xs font-bold text-foreground"
                        }
                      >
                        {reading.status === "failed"
                          ? t("status.error")
                          : formatCurrency(reading.balance)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Official DESCO Domestic Tariff Slabs & Bill Estimator Simulator */}
      <TariffEstimator />

      {/* Quick Recharge Gateway Hub (bKash, Nagad, Rocket, Upay) */}
      <RechargeHub meters={rechargeMeterOptions} />
    </div>
  );
}
