"use client";

import { useState, type ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  toCSV,
} from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type {
  AlertType,
  Meter,
  ReportFilters,
  ReportType,
} from "@/types";
import type {
  AlertHistoryRow,
  BalanceHistoryRow,
  MeterHealthRow,
  ReportData,
} from "@/lib/services/reports";

const REPORT_TYPES: { value: ReportType; labelKey: TranslationKey }[] = [
  { value: "balance_history", labelKey: "reports.balanceHistory" },
  { value: "alert_history", labelKey: "reports.alertHistory" },
  { value: "meter_health", labelKey: "reports.meterHealth" },
];

/** Status options are report-type specific — a reading is success/failed, an
 * alert is a delivery state, a meter has a derived health status. */
const STATUS_OPTIONS: Record<ReportType, { value: string; labelKey: TranslationKey }[]> = {
  balance_history: [
    { value: "success", labelKey: "status.success" },
    { value: "failed", labelKey: "status.failed" },
  ],
  alert_history: [
    { value: "sent", labelKey: "status.sent" },
    { value: "pending", labelKey: "status.pending" },
    { value: "failed", labelKey: "status.failed" },
    { value: "skipped", labelKey: "status.skipped" },
  ],
  meter_health: [
    { value: "healthy", labelKey: "status.healthy" },
    { value: "low", labelKey: "status.low" },
    { value: "critical", labelKey: "status.critical" },
    { value: "disabled", labelKey: "status.disabled" },
    { value: "error", labelKey: "status.error" },
  ],
};

const ALERT_TYPE_LABEL: Record<AlertType, TranslationKey> = {
  low_balance: "notif.lowBalance",
  critical_balance: "notif.criticalBalance",
  recovery: "notif.recovery",
};

const DELIVERY_VARIANT: Record<string, "healthy" | "critical" | "secondary" | "info"> = {
  sent: "healthy",
  success: "healthy",
  failed: "critical",
  pending: "info",
  skipped: "secondary",
};

/**
 * Reports workspace.
 *
 * Filters live in the URL so the server component re-fetches real rows on every
 * change (nothing is invented client-side). Export builds the CSV from exactly
 * the rows already on screen, escaped via `csvCell`/`toCSV`, and downloads it as
 * a Blob — no round-trip, no fabricated data.
 */
export function ReportsView({
  meters,
  filters,
  data,
}: {
  meters: Pick<Meter, "id" | "name">[];
  filters: ReportFilters;
  data: ReportData;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [exporting, setExporting] = useState(false);

  function setParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === "" || value === "all") params.delete(key);
      else params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  // Switching report type clears the status filter, whose options differ per type.
  function setType(value: string) {
    setParams({ type: value, status: "" });
  }

  const prepared = prepareReport(data, t);

  function handleExport() {
    if (prepared.rowCount === 0) return;
    setExporting(true);
    try {
      const csv = prepared.buildCsv();
      const blob = new Blob([`﻿${csv}`], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `desco-${filters.type}-${filters.dateFrom}_${filters.dateTo}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t("reports.exported"));
    } finally {
      setExporting(false);
    }
  }

  const statusOptions = STATUS_OPTIONS[filters.type];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="report-type">{t("reports.type")}</Label>
            <Select value={filters.type} onValueChange={setType}>
              <SelectTrigger id="report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report-meter">{t("reports.meter")}</Label>
            <Select
              value={filters.meterId || "all"}
              onValueChange={(value) => setParams({ meter: value })}
            >
              <SelectTrigger id="report-meter">
                <SelectValue placeholder={t("reports.allMeters")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("reports.allMeters")}</SelectItem>
                {meters.map((meter) => (
                  <SelectItem key={meter.id} value={meter.id}>
                    {meter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report-status">{t("reports.status")}</Label>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) => setParams({ status: value })}
            >
              <SelectTrigger id="report-status">
                <SelectValue placeholder={t("reports.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("reports.allStatuses")}</SelectItem>
                {statusOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range is only meaningful for time-series reports. Meter health
              is a current snapshot, so its date inputs are hidden. */}
          {filters.type !== "meter_health" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="report-from">{t("reports.from")}</Label>
                <Input
                  id="report-from"
                  type="date"
                  value={filters.dateFrom}
                  max={filters.dateTo}
                  onChange={(e) => setParams({ from: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report-to">{t("reports.to")}</Label>
                <Input
                  id="report-to"
                  type="date"
                  value={filters.dateTo}
                  min={filters.dateFrom}
                  onChange={(e) => setParams({ to: e.target.value })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result header + export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {formatNumber(prepared.rowCount)} {t("reports.rows")}
        </p>
        <Button
          onClick={handleExport}
          loading={exporting}
          disabled={prepared.rowCount === 0}
        >
          {!exporting && <Download className="size-4" aria-hidden="true" />}
          {exporting ? t("reports.exporting") : t("reports.exportCsv")}
        </Button>
      </div>

      {/* Preview */}
      {prepared.rowCount === 0 ? (
        <EmptyState
          icon={FileText}
          title={t("reports.noRecords")}
          description={t("reports.noRecordsDesc")}
        />
      ) : (
        <Card>
          <CardContent className="px-0">
            <div className="overflow-x-auto">{prepared.table}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Column model — one definition drives both the table and the CSV export, so
// they can never drift apart.
// -----------------------------------------------------------------------------
interface Column<Row> {
  label: string;
  align?: "right";
  render: (row: Row) => ReactNode;
  csv: (row: Row) => string | number | null;
}

function ReportTable<Row extends { id: string }>({
  columns,
  rows,
}: {
  columns: Column<Row>[];
  rows: Row[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead
              key={col.label}
              className={col.align === "right" ? "text-right" : undefined}
            >
              {col.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            {columns.map((col) => (
              <TableCell
                key={col.label}
                className={col.align === "right" ? "text-right tabular" : undefined}
              >
                {col.render(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function buildCsv<Row>(columns: Column<Row>[], rows: Row[]): string {
  const headers = columns.map((c) => c.label);
  const objRows = rows.map((row) =>
    Object.fromEntries(columns.map((c) => [c.label, c.csv(row)])),
  );
  return toCSV(objRows, headers);
}

function DeliveryBadge({ status, label }: { status: string; label: string }) {
  return <Badge variant={DELIVERY_VARIANT[status] ?? "secondary"}>{label}</Badge>;
}

type Translator = (key: TranslationKey) => string;

interface PreparedReport {
  table: ReactNode;
  buildCsv: () => string;
  rowCount: number;
}

/** Builds the type-specific columns, then wires them to the table + exporter. */
function prepareReport(data: ReportData, t: Translator): PreparedReport {
  switch (data.type) {
    case "balance_history": {
      const columns: Column<BalanceHistoryRow>[] = [
        {
          label: t("reports.colDate"),
          render: (r) => formatDateTime(r.checkedAt),
          csv: (r) => formatDateTime(r.checkedAt),
        },
        {
          label: t("reports.meter"),
          render: (r) => r.meterName,
          csv: (r) => r.meterName,
        },
        {
          label: t("meters.balance"),
          align: "right",
          render: (r) => formatCurrency(r.balance),
          csv: (r) => r.balance,
        },
        {
          label: t("reports.colConsumption"),
          align: "right",
          render: (r) =>
            r.consumption !== null ? formatCurrency(r.consumption) : "—",
          csv: (r) => r.consumption,
        },
        {
          label: t("reports.status"),
          render: (r) => (
            <DeliveryBadge status={r.status} label={t(`status.${r.status}`)} />
          ),
          csv: (r) => r.status,
        },
      ];
      return {
        table: <ReportTable columns={columns} rows={data.rows} />,
        buildCsv: () => buildCsv(columns, data.rows),
        rowCount: data.rows.length,
      };
    }
    case "alert_history": {
      const columns: Column<AlertHistoryRow>[] = [
        {
          label: t("reports.colDate"),
          render: (r) => formatDateTime(r.createdAt),
          csv: (r) => formatDateTime(r.createdAt),
        },
        {
          label: t("reports.meter"),
          render: (r) => r.meterName,
          csv: (r) => r.meterName,
        },
        {
          label: t("reports.colType"),
          render: (r) => t(ALERT_TYPE_LABEL[r.type]),
          csv: (r) => t(ALERT_TYPE_LABEL[r.type]),
        },
        {
          label: t("meters.balance"),
          align: "right",
          render: (r) => formatCurrency(r.balance),
          csv: (r) => r.balance,
        },
        {
          label: t("meters.threshold"),
          align: "right",
          render: (r) => formatCurrency(r.threshold),
          csv: (r) => r.threshold,
        },
        {
          label: t("reports.status"),
          render: (r) => (
            <DeliveryBadge status={r.status} label={t(`status.${r.status}`)} />
          ),
          csv: (r) => r.status,
        },
      ];
      return {
        table: <ReportTable columns={columns} rows={data.rows} />,
        buildCsv: () => buildCsv(columns, data.rows),
        rowCount: data.rows.length,
      };
    }
    case "meter_health": {
      const columns: Column<MeterHealthRow>[] = [
        {
          label: t("reports.meter"),
          render: (r) => r.name,
          csv: (r) => r.name,
        },
        {
          label: t("meters.meterNumber"),
          render: (r) => <span className="tabular">{r.meterNumber}</span>,
          csv: (r) => r.meterNumber,
        },
        {
          label: t("meters.balance"),
          align: "right",
          render: (r) => formatCurrency(r.balance),
          csv: (r) => r.balance,
        },
        {
          label: t("meters.threshold"),
          align: "right",
          render: (r) => formatCurrency(r.threshold),
          csv: (r) => r.threshold,
        },
        {
          label: t("meters.criticalThreshold"),
          align: "right",
          render: (r) => formatCurrency(r.criticalThreshold),
          csv: (r) => r.criticalThreshold,
        },
        {
          label: t("reports.status"),
          render: (r) => <StatusBadge status={r.status} />,
          csv: (r) => t(`status.${r.status}`),
        },
        {
          label: t("meters.lastChecked"),
          render: (r) => formatDateTime(r.lastCheckedAt),
          csv: (r) => (r.lastCheckedAt ? formatDateTime(r.lastCheckedAt) : ""),
        },
      ];
      return {
        table: <ReportTable columns={columns} rows={data.rows} />,
        buildCsv: () => buildCsv(columns, data.rows),
        rowCount: data.rows.length,
      };
    }
  }
}
