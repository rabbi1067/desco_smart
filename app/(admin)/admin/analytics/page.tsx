import type { Metadata } from "next";
import { Activity, CheckCircle2, Percent, Users, XCircle } from "lucide-react";
import { getSystemStats, getVolumeSeries, getAllUsers } from "@/lib/services/admin";
import { getServerTranslator } from "@/lib/i18n/server";
import { formatNumber, formatPercent } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminAnalyticsChartsLazy } from "@/components/admin/admin-analytics-charts-lazy";

export const metadata: Metadata = {
  title: "System Analytics",
};

export default async function AdminAnalyticsPage() {
  const [stats, series, users] = await Promise.all([
    getSystemStats(),
    getVolumeSeries(),
    getAllUsers(),
  ]);
  const { t } = await getServerTranslator();

  // Totals are summed from the real 14-day series — never fabricated.
  const totals = series.checks.reduce(
    (acc, day) => {
      acc.success += day.success;
      acc.failed += day.failed;
      return acc;
    },
    { success: 0, failed: 0 },
  );
  const totalChecks = totals.success + totals.failed;
  const successRate = totalChecks > 0 ? totals.success / totalChecks : null;

  const statusDistribution = [
    { key: "healthy" as const, value: stats.healthy },
    { key: "low" as const, value: stats.low },
    { key: "critical" as const, value: stats.critical },
  ];

  // "Most active" = most meters under management. Real counts, no ranking magic.
  const topUsers = [...users]
    .filter((u) => u.meter_count > 0)
    .sort((a, b) => b.meter_count - a.meter_count)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("admin.analytics.title")}
        description={t("admin.analytics.subtitle")}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label={t("admin.analytics.totalChecks")}
          value={formatNumber(totalChecks)}
          tone="primary"
        />
        <StatCard
          icon={CheckCircle2}
          label={t("admin.analytics.successfulChecks")}
          value={formatNumber(totals.success)}
          tone="healthy"
        />
        <StatCard
          icon={XCircle}
          label={t("admin.analytics.failedChecks")}
          value={formatNumber(totals.failed)}
          tone={totals.failed > 0 ? "critical" : "default"}
        />
        <StatCard
          icon={Percent}
          label={t("admin.analytics.successRate")}
          value={formatPercent(successRate)}
        />
      </div>

      <AdminAnalyticsChartsLazy
        checks={series.checks}
        alerts={series.alerts}
        statusDistribution={statusDistribution}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("admin.analytics.topUsers")}
          </CardTitle>
          <CardDescription>{t("admin.users.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {topUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t("admin.users.empty")}
              description={t("admin.users.emptyDesc")}
            />
          ) : (
            <ol className="space-y-2">
              {topUsers.map((user, index) => (
                <li
                  key={user.id}
                  className="flex items-center gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground tabular">
                    {formatNumber(index + 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {user.full_name || user.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular">
                    {formatNumber(user.meter_count)}{" "}
                    <span className="font-normal text-muted-foreground">
                      {t("admin.users.meters")}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
