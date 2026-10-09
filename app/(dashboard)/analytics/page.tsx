import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  CalendarClock,
  Gauge,
  Plus,
} from "lucide-react";
import { getServerTranslator } from "@/lib/i18n/server";
import { getMeters } from "@/lib/services/meters";
import {
  getFleetAnalytics,
  getMeterAnalytics,
} from "@/lib/services/analytics";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { AnalyticsControls } from "@/components/analytics/analytics-controls";
import { AnalyticsChartsLazy } from "@/components/analytics/analytics-charts-lazy";
import type { AnalyticsPeriod } from "@/types";

export const metadata: Metadata = {
  title: "Analytics",
};

const VALID_PERIODS: AnalyticsPeriod[] = ["7d", "14d", "30d", "custom"];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ meter?: string; period?: string }>;
}) {
  const { t } = await getServerTranslator();
  const params = await searchParams;

  const meters = await getMeters();

  // Empty account → no analytics to show. Never fabricate a series.
  if (meters.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader
          title={t("analytics.title")}
          description={t("analytics.subtitle")}
        />
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
      </div>
    );
  }

  const period: AnalyticsPeriod = VALID_PERIODS.includes(
    params.period as AnalyticsPeriod,
  )
    ? (params.period as AnalyticsPeriod)
    : "7d";

  // A meter id in the URL must belong to the user; otherwise fall back to fleet.
  const selectedMeter =
    params.meter && meters.some((m) => m.id === params.meter)
      ? params.meter
      : "all";

  const data =
    selectedMeter === "all"
      ? await getFleetAnalytics(period)
      : await getMeterAnalytics(selectedMeter, period);

  const activeMeter =
    selectedMeter === "all"
      ? undefined
      : meters.find((m) => m.id === selectedMeter);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("analytics.title")}
        description={t("analytics.subtitle")}
      />

      <AnalyticsControls
        meters={meters.map((m) => ({ id: m.id, name: m.name }))}
        currentMeter={selectedMeter}
        currentPeriod={period}
      />

      {/* Summary tiles — real figures or "—" (formatCurrency/formatNumber never fake a value). */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label={t("analytics.avgDailyUsage")}
          value={formatCurrency(data.averageDailyUsage)}
          hint={t("analytics.avgDailyUsageHint")}
          tone="primary"
        />
        <StatCard
          icon={TrendingUp}
          label={t("analytics.highestUsage")}
          value={formatCurrency(data.highestUsage)}
          hint={t("analytics.highestUsageHint")}
          tone="critical"
        />
        <StatCard
          icon={TrendingDown}
          label={t("analytics.lowestUsage")}
          value={formatCurrency(data.lowestUsage)}
          hint={t("analytics.lowestUsageHint")}
          tone="healthy"
        />
        <StatCard
          icon={Zap}
          label={t("analytics.recharges")}
          value={formatNumber(data.rechargeCount)}
          hint={t("analytics.rechargesHint")}
        />
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={CalendarClock}
          label={t("analytics.remainingDays")}
          value={
            data.remainingDays !== null
              ? formatNumber(data.remainingDays, 1)
              : "—"
          }
          hint={t("analytics.remainingDaysHint")}
          tone="low"
        />
        <StatCard
          icon={CalendarClock}
          label={t("analytics.estRecharge")}
          value={
            data.estimatedRunoutDate
              ? formatDate(data.estimatedRunoutDate)
              : "—"
          }
          hint={t("analytics.estRechargeHint")}
        />
        <StatCard
          icon={Gauge}
          label={t("meters.balance")}
          value={formatCurrency(data.currentBalance)}
          hint={t("analytics.capacityLabel")}
          tone="primary"
        />
      </section>

      {data.isEmpty ? (
        <EmptyState
          icon={Activity}
          title={t("analytics.noData")}
          description={t("analytics.noDataDesc")}
        />
      ) : (
        <AnalyticsChartsLazy data={data} threshold={activeMeter?.threshold} />
      )}

      <p className="text-center text-xs text-muted-foreground">
        {t("analytics.dataSource")}
      </p>
    </div>
  );
}
