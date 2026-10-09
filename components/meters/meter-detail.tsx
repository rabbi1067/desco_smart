"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  RefreshCw,
  Pencil,
  Trash2,
  Wallet,
  AlertTriangle,
  XCircle,
  Gauge,
  Bell,
  History,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AnalyticsChartsLazy } from "@/components/analytics/analytics-charts-lazy";
import { MeterFormDialog } from "./meter-form-dialog";
import { DeleteMeterDialog } from "./delete-meter-dialog";
import { checkMeterBalanceAction } from "@/app/actions/meters";
import { resolveDisplayStatus } from "@/lib/constants";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatRelativeTime,
} from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type {
  Alert,
  AlertType,
  AnalyticsData,
  BalanceReading,
  Meter,
} from "@/types";

const ALERT_TYPE_LABEL: Record<AlertType, TranslationKey> = {
  low_balance: "notif.lowBalance",
  critical_balance: "notif.criticalBalance",
  recovery: "notif.recovery",
};

/**
 * Full meter detail view — interactive, so it owns the check/edit/delete
 * actions and their dialogs. All data is fetched on the server and passed in;
 * this component never fetches, so it stays a thin presentational + action shell.
 */
export function MeterDetail({
  meter,
  readings,
  alerts,
  analytics,
}: {
  meter: Meter;
  readings: BalanceReading[];
  alerts: Alert[];
  analytics: AnalyticsData;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [checking, startCheck] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const displayStatus = resolveDisplayStatus(meter);

  function handleCheckNow() {
    startCheck(async () => {
      const result = await checkMeterBalanceAction({ id: meter.id });
      if (result.success) {
        toast.success(t(result.message as TranslationKey));
        router.refresh();
      } else {
        toast.error(t(result.error as TranslationKey));
      }
    });
  }

  // Newest-first for the readings table (getBalanceHistory returns oldest→newest).
  const readingsDesc = [...readings].reverse();

  const infoRows: { label: TranslationKey; value: string }[] = [
    { label: "meters.customerName", value: meter.customer_name ?? "—" },
    {
      label: "meters.installationAddress",
      value: meter.installation_address ?? "—",
    },
    { label: "meters.tariffPlan", value: meter.tariff_solution ?? "—" },
    {
      label: "meters.sanctionedLoad",
      value:
        meter.sanction_load !== null
          ? `${formatNumber(meter.sanction_load)} kW`
          : "—",
    },
    { label: "meters.phaseType", value: meter.phase_type ?? "—" },
    {
      label: "meters.monthConsumption",
      value:
        meter.current_month_consumption !== null
          ? formatCurrency(meter.current_month_consumption)
          : "—",
    },
    {
      label: "meters.readingTime",
      value: meter.reading_time ? formatDateTime(meter.reading_time) : "—",
    },
    { label: "meters.accountNumber", value: meter.account_number },
  ];

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/meters">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t("meters.backToMeters")}
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-2xl font-bold">{meter.name}</h1>
            <StatusBadge status={displayStatus} />
          </div>
          <p className="text-sm text-muted-foreground tabular">
            {meter.meter_number}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleCheckNow} loading={checking}>
            {!checking && <RefreshCw className="size-4" aria-hidden="true" />}
            {checking ? t("meters.checking") : t("meters.checkNow")}
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" aria-hidden="true" />
            {t("meters.edit")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteOpen(true)}
            aria-label={t("meters.delete")}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Balance / thresholds */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile
          icon={Wallet}
          label={t("meters.prepaidBalance")}
          value={formatCurrency(meter.current_balance)}
        />
        <SummaryTile
          icon={AlertTriangle}
          label={t("meters.threshold")}
          value={formatCurrency(meter.threshold)}
        />
        <SummaryTile
          icon={XCircle}
          label={t("meters.criticalThreshold")}
          value={formatCurrency(meter.critical_threshold)}
        />
        <SummaryTile
          icon={Gauge}
          label={t("meters.lastChecked")}
          value={
            meter.last_checked_at
              ? formatRelativeTime(meter.last_checked_at)
              : t("meters.neverChecked")
          }
        />
      </div>

      {/* Monitoring flags */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={meter.monitoring_enabled ? "healthy" : "secondary"}>
          {t("meters.monitoring")}:{" "}
          {meter.monitoring_enabled ? t("meters.enabled") : t("meters.disabled")}
        </Badge>
        <Badge variant={meter.email_alert_enabled ? "info" : "secondary"}>
          {t("meters.emailAlerts")}:{" "}
          {meter.email_alert_enabled
            ? t("meters.enabled")
            : t("meters.disabled")}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <Info className="size-4" aria-hidden="true" />
            {t("meters.overview")}
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="size-4" aria-hidden="true" />
            {t("meters.balanceHistory")}
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="size-4" aria-hidden="true" />
            {t("meters.alerts")}
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("meters.overview")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {infoRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex flex-col gap-0.5 border-b border-border/40 pb-3"
                  >
                    <dt className="text-xs text-muted-foreground">
                      {t(row.label)}
                    </dt>
                    <dd className="text-sm font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance history */}
        <TabsContent value="history" className="space-y-4">
          {analytics.isEmpty && readingsDesc.length === 0 ? (
            <EmptyState
              icon={History}
              title={t("empty.noHistory")}
              description={t("empty.noHistoryDesc")}
            />
          ) : (
            <>
              {!analytics.isEmpty && (
                <AnalyticsChartsLazy data={analytics} threshold={meter.threshold} />
              )}
              {readingsDesc.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t("meters.balanceHistory")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("meters.readingTime")}</TableHead>
                            <TableHead className="text-right">
                              {t("meters.balance")}
                            </TableHead>
                            <TableHead className="text-right">
                              {t("meters.monthConsumption")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {readingsDesc.slice(0, 50).map((reading) => (
                            <TableRow key={reading.id}>
                              <TableCell>
                                {formatDateTime(reading.checked_at)}
                              </TableCell>
                              <TableCell className="text-right tabular font-medium">
                                {formatCurrency(reading.balance)}
                              </TableCell>
                              <TableCell className="text-right tabular text-muted-foreground">
                                {reading.current_month_consumption !== null
                                  ? formatCurrency(
                                      reading.current_month_consumption,
                                    )
                                  : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts">
          {alerts.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={t("empty.noAlerts")}
              description={t("empty.noAlertsDesc")}
            />
          ) : (
            <Card>
              <CardContent className="px-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("notif.title")}</TableHead>
                        <TableHead className="text-right">
                          {t("meters.balance")}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("reports.status")}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("meters.lastChecked")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alerts.map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell className="font-medium">
                            {t(ALERT_TYPE_LABEL[alert.type])}
                          </TableCell>
                          <TableCell className="text-right tabular">
                            {formatCurrency(alert.balance)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={
                                alert.status === "sent"
                                  ? "healthy"
                                  : alert.status === "failed"
                                    ? "critical"
                                    : "secondary"
                              }
                            >
                              {t(`status.${alert.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatDateTime(alert.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <MeterFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        meter={meter}
      />
      <DeleteMeterDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        meter={meter}
      />
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="size-3.5" aria-hidden="true" />
          {label}
        </p>
        <p className="truncate text-lg font-bold tabular">{value}</p>
      </CardContent>
    </Card>
  );
}
