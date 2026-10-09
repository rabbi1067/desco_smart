import type { Metadata } from "next";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Users,
  XCircle,
} from "lucide-react";
import { getSystemStats } from "@/lib/services/admin";
import { getServerTranslator } from "@/lib/i18n/server";
import { formatNumber, formatPercent } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Executive Control",
};

export default async function AdminOverviewPage() {
  const stats = await getSystemStats();
  const { t } = await getServerTranslator();

  const successRate =
    stats.checksToday > 0
      ? stats.successfulChecksToday / stats.checksToday
      : null;

  const tiles = [
    {
      icon: Users,
      label: t("admin.totalUsers"),
      value: formatNumber(stats.totalUsers),
      tone: "primary" as const,
    },
    {
      icon: Gauge,
      label: t("admin.totalMeters"),
      value: formatNumber(stats.totalMeters),
      hint: `${formatNumber(stats.activeMeters)} · ${t("admin.activeMeters")}`,
      tone: "default" as const,
    },
    {
      icon: AlertTriangle,
      label: t("admin.alertsToday"),
      value: formatNumber(stats.alertsToday),
      tone: stats.alertsToday > 0 ? ("low" as const) : ("default" as const),
    },
    {
      icon: Activity,
      label: t("admin.checksToday"),
      value: formatNumber(stats.checksToday),
      hint:
        successRate !== null
          ? `${formatPercent(successRate)} · ${t("admin.analytics.successRate")}`
          : undefined,
      tone: "default" as const,
    },
  ];

  const health = [
    {
      icon: CheckCircle2,
      label: t("status.healthy"),
      value: stats.healthy,
      tone: "healthy" as const,
    },
    {
      icon: AlertTriangle,
      label: t("status.low"),
      value: stats.low,
      tone: "low" as const,
    },
    {
      icon: XCircle,
      label: t("status.critical"),
      value: stats.critical,
      tone: "critical" as const,
    },
  ];

  const healthTotal = stats.healthy + stats.low + stats.critical;

  return (
    <div className="space-y-8">
      <PageHeader title={t("admin.title")} description={t("admin.subtitle")} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <StatCard key={tile.label} {...tile} />
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fleet health distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.systemHealth")}</CardTitle>
            <CardDescription>{t("admin.analytics.metersByStatus")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {health.map((item) => {
              const share =
                healthTotal > 0 ? (item.value / healthTotal) * 100 : 0;
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <item.icon
                        className={toneText(item.tone)}
                        aria-hidden="true"
                      />
                      {item.label}
                    </span>
                    <span className="font-semibold tabular">
                      {formatNumber(item.value)}
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={Math.round(share)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={item.label}
                  >
                    <div
                      className={toneBar(item.tone)}
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {healthTotal === 0 && (
              <p className="text-sm text-muted-foreground">
                {t("admin.meters.empty")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Monitoring reliability today */}
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.analytics.title")}</CardTitle>
            <CardDescription>{t("admin.checksToday")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReliabilityRow
              label={t("admin.analytics.successfulChecks")}
              value={formatNumber(stats.successfulChecksToday)}
            />
            <ReliabilityRow
              label={t("admin.failedChecks")}
              value={formatNumber(stats.failedChecks)}
              emphasize={stats.failedChecks > 0}
            />
            <ReliabilityRow
              label={t("admin.analytics.successRate")}
              value={successRate !== null ? formatPercent(successRate) : "—"}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReliabilityRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={
          emphasize
            ? "font-semibold tabular text-critical-foreground"
            : "font-semibold tabular"
        }
      >
        {value}
      </span>
    </div>
  );
}

function toneText(tone: "healthy" | "low" | "critical"): string {
  const map = {
    healthy: "size-4 text-healthy-foreground",
    low: "size-4 text-low-foreground",
    critical: "size-4 text-critical-foreground",
  };
  return map[tone];
}

function toneBar(tone: "healthy" | "low" | "critical"): string {
  const map = {
    healthy: "h-full rounded-full bg-healthy",
    low: "h-full rounded-full bg-low",
    critical: "h-full rounded-full bg-critical",
  };
  return map[tone];
}
