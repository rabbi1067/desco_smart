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
} from "lucide-react";
import { getServerTranslator } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/auth";
import {
  getMeters,
  summariseFleet,
  filterNeedsAttention,
  getRecentReadings,
} from "@/lib/services/meters";
import { resolveDisplayStatus } from "@/lib/constants";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const { t } = await getServerTranslator();

  // Fetched once, derived locally — avoids three round-trips for one meter list.
  const [profile, meters, recent] = await Promise.all([
    getCurrentProfile(),
    getMeters(),
    getRecentReadings(6),
  ]);
  const summary = summariseFleet(meters);
  const needsAttention = filterNeedsAttention(meters);

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? "";

  return (
    <div className="space-y-8">
      <PageHeader
        title={
          firstName ? `${t("dash.welcome")}, ${firstName}` : t("dash.title")
        }
        description={t("dash.overview")}
        action={
          <Button asChild>
            <Link href="/meters">
              <Plus className="size-4" aria-hidden="true" />
              {t("dash.addMeter")}
            </Link>
          </Button>
        }
      />

      {meters.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title={t("empty.noMeters")}
          description={t("empty.noMetersDesc")}
          action={
            <Button asChild>
              <Link href="/meters">
                <Plus className="size-4" aria-hidden="true" />
                {t("dash.addMeter")}
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Summary tiles */}
          <section
            aria-label={t("dash.overview")}
            className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          >
            <StatCard
              icon={Gauge}
              label={t("dash.totalMeters")}
              value={String(summary.total)}
              tone="primary"
            />
            <StatCard
              icon={CheckCircle2}
              label={t("dash.healthy")}
              value={String(summary.healthy)}
              tone="healthy"
            />
            <StatCard
              icon={AlertTriangle}
              label={t("dash.lowBalance")}
              value={String(summary.low)}
              tone="low"
            />
            <StatCard
              icon={XCircle}
              label={t("dash.critical")}
              value={String(summary.critical)}
              tone="critical"
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Combined balance + needs attention */}
            <div className="space-y-6 lg:col-span-2">
              <StatCard
                icon={Wallet}
                label={t("dash.totalBalance")}
                value={formatCurrency(summary.totalBalance)}
                hint={t("dash.connectedMetersDesc")}
                tone="primary"
              />

              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle
                        className="size-4 text-low-foreground"
                        aria-hidden="true"
                      />
                      {t("dash.needsAttention")}
                    </CardTitle>
                  </div>
                  {needsAttention.length > 0 && (
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/meters">
                        {t("dash.viewAll")}
                        <ArrowRight className="size-4" aria-hidden="true" />
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
                        <li key={meter.id}>
                          <Link
                            href={`/meters/${meter.id}`}
                            className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {meter.name}
                              </p>
                              <p className="truncate text-xs text-muted-foreground tabular">
                                {meter.meter_number}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                              <span className="tabular text-sm font-semibold">
                                {formatCurrency(meter.current_balance)}
                              </span>
                              <StatusBadge
                                status={resolveDisplayStatus(meter)}
                              />
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent activity */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="size-4" aria-hidden="true" />
                  {t("dash.recentActivity")}
                </CardTitle>
                <CardDescription>{t("dash.recentActivityDesc")}</CardDescription>
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
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {reading.meter_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(reading.checked_at)}
                          </p>
                        </div>
                        <span
                          className={
                            reading.status === "failed"
                              ? "shrink-0 text-sm font-medium text-critical-foreground"
                              : "shrink-0 tabular text-sm font-semibold"
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
