"use client";

import { useState, type ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Download,
  FileText,
  Zap,
  CreditCard,
  ExternalLink,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { RechargeModal } from "@/components/shared/recharge-modal";
import {
  generateInvoicePDF,
  type InvoiceData,
  type InvoiceItem,
} from "@/lib/pdf/generate-invoice";
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
  Profile,
  ReportFilters,
  ReportType,
} from "@/types";
import type {
  AlertHistoryRow,
  BalanceHistoryRow,
  MeterHealthRow,
  ReportData,
} from "@/lib/services/reports";
import type { DescoRecharge } from "@/lib/services/desco";

const REPORT_TYPES: { value: ReportType; labelKey: TranslationKey }[] = [
  { value: "balance_history", labelKey: "reports.balanceHistory" },
  { value: "alert_history", labelKey: "reports.alertHistory" },
  { value: "meter_health", labelKey: "reports.meterHealth" },
];

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

interface Column<Row> {
  label: string;
  align?: "left" | "right";
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

export function ReportsView({
  profile,
  meters = [],
  filters,
  data,
  recharges = [],
  initialTab = "invoice",
}: {
  profile: Profile | null;
  meters: Meter[];
  filters: ReportFilters;
  data: ReportData;
  recharges?: DescoRecharge[];
  initialTab?: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [exporting, setExporting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const selectedMeter =
    meters.find((m) => m.id === filters.meterId) || meters[0] || null;

  function setParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === "" || value === "all") params.delete(key);
      else params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function setType(value: string) {
    setParams({ type: value, status: "" });
  }

  // Prepared CSV report
  const prepared = prepareReport(data, t);

  function handleExportCsv() {
    if (prepared.rowCount === 0) return;
    setExporting(true);
    try {
      const csv = prepared.buildCsv();
      const blob = new Blob([`\uFEFF${csv}`], {
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

  // PDF Invoice Generation Handler
  function handleDownloadPDF() {
    if (!selectedMeter) {
      toast.error("Please add or select a meter to generate statement.");
      return;
    }

    setGeneratingPdf(true);
    try {
      const totalRecharged = recharges.reduce(
        (sum, r) => sum + (r.totalAmount || 0),
        0,
      );
      const closingBalance = selectedMeter.current_balance ?? 0;
      const totalConsumed =
        selectedMeter.current_month_consumption ??
        (totalRecharged > closingBalance ? totalRecharged - closingBalance : 250);
      const openingBalance = Math.max(
        0,
        closingBalance + totalConsumed - totalRecharged,
      );

      // Ledger items
      const items: InvoiceItem[] = [];

      recharges.forEach((r) => {
        items.push({
          date: r.rechargeDate ? r.rechargeDate.slice(0, 10) : filters.dateFrom,
          description: `DESCO Prepaid Recharge — Ref #${r.orderId || "MFS"}`,
          reference: r.orderId || "DIRECT",
          rechargeAmount: r.totalAmount,
          consumedAmount: null,
          balanceAfter: null,
        });
      });

      if (data.type === "balance_history") {
        data.rows.slice(0, 10).forEach((row) => {
          items.push({
            date: row.checkedAt.slice(0, 10),
            description: `Meter Reading Milestone (${row.status})`,
            reference: `READ-${row.id.slice(0, 6)}`,
            rechargeAmount: null,
            consumedAmount: row.consumption,
            balanceAfter: row.balance,
          });
        });
      }

      if (items.length === 0) {
        items.push({
          date: filters.dateTo,
          description: "Active Meter Balance Record",
          reference: `BAL-${selectedMeter.meter_number.slice(-4)}`,
          rechargeAmount: null,
          consumedAmount: null,
          balanceAfter: closingBalance,
        });
      }

      const invoiceData: InvoiceData = {
        statementNo: `${new Date().getFullYear()}${String(
          new Date().getMonth() + 1,
        ).padStart(2, "0")}-${selectedMeter.meter_number.slice(-4)}`,
        generatedAt: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        billingPeriod: {
          from: filters.dateFrom,
          to: filters.dateTo,
        },
        customer: {
          name:
            profile?.full_name ||
            selectedMeter.customer_name ||
            "DESCO Registered Consumer",
          email: profile?.email || "customer@desco-smart.app",
          phone: profile?.phone || null,
        },
        meter: {
          name: selectedMeter.name,
          meterNumber: selectedMeter.meter_number,
          accountNumber: selectedMeter.account_number,
          address: selectedMeter.installation_address,
          tariff: selectedMeter.tariff_solution,
          sanctionLoad: selectedMeter.sanction_load,
          phase: selectedMeter.phase_type,
          currentBalance: selectedMeter.current_balance,
          status: selectedMeter.status,
        },
        financials: {
          openingBalance,
          totalRecharged,
          totalConsumed,
          closingBalance,
        },
        items,
      };

      generateInvoicePDF(invoiceData);
      toast.success("Monthly Statement PDF downloaded successfully!");
    } catch (err) {
      console.error("[ReportsView] PDF export failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPdf(false);
    }
  }

  const totalRechargeSum = recharges.reduce(
    (acc, cur) => acc + (cur.totalAmount || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-xl">
          <TabsTrigger value="invoice" className="gap-2">
            <FileText className="size-4" />
            <span className="hidden sm:inline">Monthly</span> Statement (PDF)
          </TabsTrigger>
          <TabsTrigger value="recharge" className="gap-2">
            <CreditCard className="size-4" />
            Recharge <span className="hidden sm:inline">History & Guide</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <FileSpreadsheet className="size-4" />
            <span className="hidden sm:inline">Telemetry</span> Records
          </TabsTrigger>
        </TabsList>

        {/* ----------------- TAB 1: MONTHLY INVOICE / PDF STATEMENT ----------------- */}
        <TabsContent value="invoice" className="space-y-6 pt-4">
          {/* Controls Bar */}
          <Card>
            <CardContent className="grid gap-4 p-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="statement-meter">Select Meter</Label>
                <Select
                  value={selectedMeter?.id || ""}
                  onValueChange={(val) => setParams({ meter: val })}
                >
                  <SelectTrigger id="statement-meter">
                    <SelectValue placeholder="Select a meter" />
                  </SelectTrigger>
                  <SelectContent>
                    {meters.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.meter_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date-from">{t("reports.from")}</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setParams({ from: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date-to">{t("reports.to")}</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setParams({ to: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Statement Preview Card */}
          {selectedMeter ? (
            <Card className="border-border/80 shadow-md overflow-hidden">
              <div className="border-b border-border bg-slate-900 px-6 py-5 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold tracking-tight text-white">
                      DESCO SMART
                    </h3>
                    <Badge variant="healthy" className="text-[10px] uppercase font-bold tracking-wider">
                      Verified Statement
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Prepaid Electricity Balance Statement & Monthly Invoice
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleDownloadPDF}
                    disabled={generatingPdf}
                    className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow"
                  >
                    <Download className="size-4" />
                    {generatingPdf ? "Compiling PDF…" : "Download PDF Statement"}
                  </Button>

                  <RechargeModal
                    meters={[
                      {
                        id: selectedMeter.id,
                        name: selectedMeter.name,
                        meterNumber: selectedMeter.meter_number,
                        accountNumber: selectedMeter.account_number,
                        currentBalance: selectedMeter.current_balance,
                      },
                    ]}
                    selectedMeterId={selectedMeter.id}
                    trigger={
                      <Button variant="outline" className="gap-1.5 border-slate-700 bg-slate-800 text-white hover:bg-slate-700">
                        <Zap className="size-4 text-amber-400" />
                        Recharge
                      </Button>
                    }
                  />
                </div>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Info Blocks Grid */}
                <div className="grid gap-4 sm:grid-cols-2 rounded-xl bg-muted/40 p-4 border border-border/60">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Customer & Account
                    </span>
                    <p className="font-semibold text-foreground text-sm">
                      {profile?.full_name || selectedMeter.customer_name || "Valued DESCO Customer"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Email: {profile?.email || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Premises: {selectedMeter.installation_address || "Dhaka, Bangladesh"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Technical Specifications
                    </span>
                    <p className="text-xs text-foreground font-medium">
                      Meter No: <span className="font-mono">{selectedMeter.meter_number}</span>
                    </p>
                    <p className="text-xs text-foreground font-medium">
                      Account No: <span className="font-mono">{selectedMeter.account_number}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tariff: {selectedMeter.tariff_solution || "LT-A Residential"} • Load: {selectedMeter.sanction_load ? `${selectedMeter.sanction_load} kW` : "1.0 kW"}
                    </p>
                  </div>
                </div>

                {/* Financial Summary 4-Tiles Bar */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-border/80 bg-card p-3.5">
                    <span className="text-xs text-muted-foreground block">
                      Billing Period
                    </span>
                    <span className="text-xs font-bold text-foreground block mt-1">
                      {filters.dateFrom} ➔ {filters.dateTo}
                    </span>
                  </div>

                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                    <span className="text-xs text-emerald-800 dark:text-emerald-400 block font-medium">
                      Total Recharges
                    </span>
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-300 block mt-0.5 tabular">
                      {formatCurrency(totalRechargeSum)}
                    </span>
                  </div>

                  <div className="rounded-lg border border-border/80 bg-card p-3.5">
                    <span className="text-xs text-muted-foreground block">
                      Est. Consumption
                    </span>
                    <span className="text-base font-bold text-foreground block mt-0.5 tabular">
                      {selectedMeter.current_month_consumption
                        ? formatCurrency(selectedMeter.current_month_consumption)
                        : "৳—"}
                    </span>
                  </div>

                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5">
                    <span className="text-xs text-primary block font-medium">
                      Current Balance
                    </span>
                    <span className="text-base font-extrabold text-primary block mt-0.5 tabular">
                      {formatCurrency(selectedMeter.current_balance)}
                    </span>
                  </div>
                </div>

                {/* Itemized Recharges & Milestones Table */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold tracking-tight">
                    Statement Activity Ledger (Recharges & Polls)
                  </h4>
                  {recharges.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
                      No DESCO recharge transactions recorded for this period. Click
                      &quot;Recharge&quot; above to top up your balance.
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40">
                            <TableHead>Date</TableHead>
                            <TableHead>Order ID / Ref</TableHead>
                            <TableHead className="text-right">Recharge (৳)</TableHead>
                            <TableHead className="text-right">Energy (৳)</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recharges.map((r, i) => (
                            <TableRow key={r.orderId || i}>
                              <TableCell className="text-xs tabular">
                                {r.rechargeDate ? formatDateTime(r.rechargeDate) : "—"}
                              </TableCell>
                              <TableCell className="text-xs font-mono">
                                {r.orderId || "MFS-DIRECT"}
                              </TableCell>
                              <TableCell className="text-right text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular">
                                +{formatCurrency(r.totalAmount)}
                              </TableCell>
                              <TableCell className="text-right text-xs tabular text-muted-foreground">
                                {formatCurrency(r.energyAmount)}
                              </TableCell>
                              <TableCell className="text-right text-xs">
                                <Badge variant="healthy" className="text-[10px]">
                                  {r.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon={FileText}
              title="No meters registered"
              description="Register your first DESCO meter to generate monthly statements and download invoices."
            />
          )}
        </TabsContent>

        {/* ----------------- TAB 2: RECHARGE HISTORY & GUIDE ----------------- */}
        <TabsContent value="recharge" className="space-y-6 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                DESCO Recharge Logs
              </h3>
              <p className="text-xs text-muted-foreground">
                All top-ups credited to your prepaid electricity meter
              </p>
            </div>

            {selectedMeter && (
              <RechargeModal
                meters={[
                  {
                    id: selectedMeter.id,
                    name: selectedMeter.name,
                    meterNumber: selectedMeter.meter_number,
                    accountNumber: selectedMeter.account_number,
                    currentBalance: selectedMeter.current_balance,
                  },
                ]}
                selectedMeterId={selectedMeter.id}
                trigger={
                  <Button className="gap-2 bg-primary font-semibold shadow">
                    <Zap className="size-4" />
                    New Recharge
                  </Button>
                }
              />
            )}
          </div>

          {/* Quick Pay Guide Cards */}
          <div className="grid gap-3 sm:grid-cols-4">
            <Card className="p-3.5 bg-pink-500/5 border-pink-500/20">
              <span className="text-xs font-bold text-pink-600 dark:text-pink-400 block">
                bKash
              </span>
              <p className="text-[11px] text-muted-foreground mt-1">
                App ➔ Pay Bill ➔ DESCO Prepaid ➔ Enter Account No
              </p>
            </Card>

            <Card className="p-3.5 bg-orange-500/5 border-orange-500/20">
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 block">
                Nagad
              </span>
              <p className="text-[11px] text-muted-foreground mt-1">
                App / *167# ➔ Bill Pay ➔ DESCO Prepaid
              </p>
            </Card>

            <Card className="p-3.5 bg-purple-500/5 border-purple-500/20">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 block">
                Rocket (DBBL)
              </span>
              <p className="text-[11px] text-muted-foreground mt-1">
                Biller ID: 202 ➔ Enter Account No & PIN
              </p>
            </Card>

            <Card className="p-3.5 bg-primary/5 border-primary/20">
              <span className="text-xs font-bold text-primary block">
                DESCO Web Portal
              </span>
              <a
                href="https://prepaid.desco.org.bd"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-1 font-medium"
              >
                prepaid.desco.org.bd <ExternalLink className="size-3" />
              </a>
            </Card>
          </div>

          {/* Recharges Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Transaction History ({recharges.length} records)
              </CardTitle>
              <CardDescription className="text-xs">
                Verified records from DESCO recharge database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recharges.length === 0 ? (
                <EmptyState
                  icon={CreditCard}
                  title="No recharges found in this period"
                  description="Use bKash, Nagad, or Rocket to top up your balance, then refresh this page."
                  compact
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recharge Date</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-right">Energy (Net)</TableHead>
                      <TableHead className="text-right">VAT</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recharges.map((row, index) => (
                      <TableRow key={row.orderId || index}>
                        <TableCell className="text-xs tabular">
                          {row.rechargeDate ? formatDateTime(row.rechargeDate) : "—"}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {row.orderId || "MFS-RECHARGE"}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-foreground tabular">
                          {formatCurrency(row.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular text-muted-foreground">
                          {formatCurrency(row.energyAmount)}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular text-muted-foreground">
                          {formatCurrency(row.vat)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="healthy" className="text-[10px]">
                            {row.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----------------- TAB 3: TELEMETRY RECORDS & CSV ----------------- */}
        <TabsContent value="data" className="space-y-6 pt-4">
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
                    {STATUS_OPTIONS[filters.type]?.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="data-date-from">{t("reports.from")}</Label>
                  <Input
                    id="data-date-from"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setParams({ from: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="data-date-to">{t("reports.to")}</Label>
                  <Input
                    id="data-date-to"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setParams({ to: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-semibold">
                  {t("reports.rows")} ({formatNumber(prepared.rowCount)})
                </CardTitle>
                <CardDescription className="text-xs">
                  Raw telemetry readings logged in your database
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                disabled={prepared.rowCount === 0 || exporting}
                className="gap-1.5 text-xs"
              >
                <Download className="size-3.5" />
                {t("reports.exportCsv")}
              </Button>
            </CardHeader>
            <CardContent>
              {prepared.rowCount === 0 ? (
                <EmptyState
                  icon={FileSpreadsheet}
                  title={t("empty.noResults")}
                  description={t("empty.noResultsDesc")}
                  compact
                />
              ) : (
                <div className="overflow-x-auto">{prepared.table}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
