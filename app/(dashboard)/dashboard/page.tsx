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
  Sparkles,
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
      {/* Page Header with Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {firstName ? `${t("dash.welcome")}, ${firstName}` : t("dash.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("dash.overview")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {meters.length > 0 && (
            <RechargeModal
              meters={rechargeMeterOptions}
              trigger={
                <Button variant="default" className="gap-2 bg-primary font-semibold shadow-sm">
                  <Zap className="size-4" />
                  Quick Recharge / রিচার্জ
                </Button>
              }
            />
          )}

          <Button asChild variant={meters.length === 0 ? "default" : "outline"}>
            <Link href="/meters" className="gap-1.5">
              <Plus className="size-4" />
              {t("dash.addMeter")}
            </Link>
          </Button>
        </div>
      </div>

      {meters.length === 0 ? (
        /* Zero-meter Onboarding Experience */
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 sm:p-8">
              <div className="max-w-2xl space-y-4">
                <Badge variant="healthy" className="gap-1 px-2.5 py-0.5 text-xs font-semibold">
                  <Sparkles className="size-3.5" />
                  Get Started
                </Badge>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Connect your first DESCO prepaid meter
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Start tracking your prepaid electricity balance 24/7. Never get disconnected in the
                  dark again. We automatically check your balance and alert you via email before
                  it runs out.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <Button asChild size="lg" className="gap-2 shadow font-semibold">
                    <Link href="/meters">
                      <Plus className="size-4" />
                      Add Meter Now / মিটার যুক্ত করুন
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <div className="size-10 rounded-lg bg-primary/10 grid place-items-center mb-3">
                <Gauge className="size-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">24/7 Automated Monitoring</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Reads your meter balance directly from DESCO servers around the clock.
              </p>
            </Card>

            <Card className="p-5">
              <div className="size-10 rounded-lg bg-amber-500/10 grid place-items-center mb-3">
                <AlertTriangle className="size-5 text-amber-500" />
              </div>
              <h3 className="font-semibold text-sm">Smart Low-Balance Alerts</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Set custom low and critical balance thresholds with real-time in-app & email warnings.
              </p>
            </Card>

            <Card className="p-5">
              <div className="size-10 rounded-lg bg-emerald-500/10 grid place-items-center mb-3">
                <Wallet className="size-5 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-sm">Statements & Easy Recharge</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Download monthly branded PDF statements and recharge with bKash, Nagad, and Rocket in seconds.
              </p>
            </Card>
          </div>
        </div>
      ) : (
        <>
          {/* Active Balance Alert Banner (Emergency or Normal Status) */}
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
                        Recharge Immediately / রিচার্জ করুন
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
                        Top-up Balance / রিচার্জ করুন
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium">
                All connected meters are healthy and operating normally with automated monitoring active.
              </span>
            </div>
          )}

          {/* Core Metric Cards */}
          <section
            aria-label={t("dash.overview")}
            className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          >
            <StatCard
              icon={Wallet}
              label={t("dash.totalBalance")}
              value={formatCurrency(summary.totalBalance)}
              hint={`${meters.length} active meter${meters.length > 1 ? "s" : ""}`}
              tone="primary"
            />
            <StatCard
              icon={Gauge}
              label={t("dash.totalMeters")}
              value={String(summary.total)}
              hint={`${summary.healthy} healthy, ${summary.low + summary.critical} alert(s)`}
              tone={summary.critical > 0 ? "critical" : summary.low > 0 ? "low" : "healthy"}
            />
            <StatCard
              icon={TrendingDown}
              label="Avg Daily Burn"
              value={
                analytics.averageDailyUsage !== null
                  ? `৳${analytics.averageDailyUsage.toFixed(2)}`
                  : "Calculating…"
              }
              hint="Estimated daily spend"
              tone="primary"
            />
            <StatCard
              icon={Calendar}
              label="Estimated Runway"
              value={
                analytics.remainingDays !== null && analytics.remainingDays > 0
                  ? `${Math.floor(analytics.remainingDays)} Days`
                  : "Safe"
              }
              hint={
                analytics.estimatedRunoutDate
                  ? `Until ~${new Date(analytics.estimatedRunoutDate).toLocaleDateString()}`
                  : "Based on consumption"
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

          {/* Interactive Recharts Graphics & Meter Fleet Gauges */}
          <DashboardCharts analytics={analytics} meters={meters} />

          {/* Needs Attention & Recent History Activity Row */}
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
        </>
      )}
    </div>
  );
}
