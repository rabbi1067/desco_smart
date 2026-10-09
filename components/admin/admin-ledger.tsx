"use client";

import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDateTime, formatNumber, toCSV } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { AlertType } from "@/types";
import type {
  AdminLedgerAlert,
  AdminLedgerReading,
} from "@/lib/services/admin";

const ALERT_TYPE_LABEL: Record<AlertType, TranslationKey> = {
  low_balance: "notif.lowBalance",
  critical_balance: "notif.criticalBalance",
  recovery: "notif.recovery",
};

const STATUS_VARIANT: Record<
  string,
  "healthy" | "critical" | "secondary" | "info"
> = {
  success: "healthy",
  sent: "healthy",
  failed: "critical",
  pending: "info",
  skipped: "secondary",
};

/**
 * System-wide monitoring ledger (admin only).
 *
 * Two read-only views over real rows fetched by the admin service: every balance
 * check and every alert across all accounts. CSV export serialises exactly the
 * rows on screen via `toCSV` — no fabricated data, no server round-trip.
 */
export function AdminLedger({
  readings,
  alerts,
}: {
  readings: AdminLedgerReading[];
  alerts: AdminLedgerAlert[];
}) {
  const { t } = useTranslation();

  function download(filename: string, rows: Record<string, unknown>[], headers: string[]) {
    const csv = toCSV(rows, headers);
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t("reports.exported"));
  }

  function exportReadings() {
    const headers = [
      t("reports.colDate"),
      t("reports.meter"),
      t("admin.meters.owner"),
      t("meters.balance"),
      t("reports.status"),
    ];
    const rows = readings.map((r) => ({
      [headers[0]]: formatDateTime(r.checkedAt),
      [headers[1]]: r.meterName,
      [headers[2]]: r.ownerEmail ?? r.ownerName ?? "",
      [headers[3]]: r.balance,
      [headers[4]]: t(`status.${r.status}`),
    }));
    download("desco-admin-readings.csv", rows, headers);
  }

  function exportAlerts() {
    const headers = [
      t("reports.colDate"),
      t("reports.meter"),
      t("admin.meters.owner"),
      t("reports.colType"),
      t("meters.balance"),
      t("meters.threshold"),
      t("reports.status"),
    ];
    const rows = alerts.map((a) => ({
      [headers[0]]: formatDateTime(a.createdAt),
      [headers[1]]: a.meterName,
      [headers[2]]: a.ownerEmail ?? a.ownerName ?? "",
      [headers[3]]: t(ALERT_TYPE_LABEL[a.type]),
      [headers[4]]: a.balance,
      [headers[5]]: a.threshold,
      [headers[6]]: t(`status.${a.status}`),
    }));
    download("desco-admin-alerts.csv", rows, headers);
  }

  return (
    <Tabs defaultValue="readings" className="space-y-4">
      <TabsList>
        <TabsTrigger value="readings">
          {t("reports.balanceHistory")}
        </TabsTrigger>
        <TabsTrigger value="alerts">{t("reports.alertHistory")}</TabsTrigger>
      </TabsList>

      {/* Balance readings ledger */}
      <TabsContent value="readings" className="space-y-3">
        <LedgerToolbar
          count={readings.length}
          onExport={exportReadings}
          label={t("reports.rows")}
          exportLabel={t("reports.exportCsv")}
        />
        {readings.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t("reports.noRecords")}
            description={t("reports.noRecordsDesc")}
          />
        ) : (
          <Card>
            <CardContent className="overflow-x-auto px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("reports.colDate")}</TableHead>
                    <TableHead>{t("reports.meter")}</TableHead>
                    <TableHead>{t("admin.meters.owner")}</TableHead>
                    <TableHead className="text-right">
                      {t("meters.balance")}
                    </TableHead>
                    <TableHead>{t("reports.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(r.checkedAt)}
                      </TableCell>
                      <TableCell className="font-medium">{r.meterName}</TableCell>
                      <TableCell>
                        <OwnerCell name={r.ownerName} email={r.ownerEmail} />
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular">
                        {formatCurrency(r.balance)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[r.status] ?? "secondary"}>
                          {t(`status.${r.status}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Alerts ledger */}
      <TabsContent value="alerts" className="space-y-3">
        <LedgerToolbar
          count={alerts.length}
          onExport={exportAlerts}
          label={t("reports.rows")}
          exportLabel={t("reports.exportCsv")}
        />
        {alerts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t("reports.noRecords")}
            description={t("reports.noRecordsDesc")}
          />
        ) : (
          <Card>
            <CardContent className="overflow-x-auto px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("reports.colDate")}</TableHead>
                    <TableHead>{t("reports.meter")}</TableHead>
                    <TableHead>{t("admin.meters.owner")}</TableHead>
                    <TableHead>{t("reports.colType")}</TableHead>
                    <TableHead className="text-right">
                      {t("meters.balance")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("meters.threshold")}
                    </TableHead>
                    <TableHead>{t("reports.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(a.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">{a.meterName}</TableCell>
                      <TableCell>
                        <OwnerCell name={a.ownerName} email={a.ownerEmail} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {t(ALERT_TYPE_LABEL[a.type])}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular">
                        {formatCurrency(a.balance)}
                      </TableCell>
                      <TableCell className="text-right tabular text-muted-foreground">
                        {formatCurrency(a.threshold)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[a.status] ?? "secondary"}>
                          {t(`status.${a.status}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}

function LedgerToolbar({
  count,
  label,
  exportLabel,
  onExport,
}: {
  count: number;
  label: string;
  exportLabel: string;
  onExport: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {formatNumber(count)} {label}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        disabled={count === 0}
      >
        <Download className="size-4" aria-hidden="true" />
        {exportLabel}
      </Button>
    </div>
  );
}

function OwnerCell({
  name,
  email,
}: {
  name: string | null;
  email: string | null;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm">{name || "—"}</p>
      {email && (
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      )}
    </div>
  );
}
