import type { Metadata } from "next";
import { getServerTranslator } from "@/lib/i18n/server";
import { getMeters } from "@/lib/services/meters";
import { getReport } from "@/lib/services/reports";
import { reportFilterSchema } from "@/lib/validations";
import { toISODate, daysAgo } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { ReportsView } from "@/components/reports/reports-view";
import type { ReportFilters } from "@/types";

export const metadata: Metadata = {
  title: "Reports",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    meter?: string;
    from?: string;
    to?: string;
    status?: string;
  }>;
}) {
  const { t } = await getServerTranslator();
  const params = await searchParams;

  // Meters power the filter dropdown and gate the meter filter to owned rows.
  const meters = await getMeters();

  // Build a candidate filter from the URL, falling back to a sensible 30-day
  // window, then validate. Anything invalid collapses to the defaults so the
  // page can never crash on a hand-edited query string.
  const defaults = {
    type: "balance_history" as const,
    meterId: "",
    dateFrom: toISODate(daysAgo(30)),
    dateTo: toISODate(new Date()),
    status: "",
  };

  const candidate = {
    type: params.type ?? defaults.type,
    meterId: params.meter ?? "",
    dateFrom: params.from ?? defaults.dateFrom,
    dateTo: params.to ?? defaults.dateTo,
    status: params.status ?? "",
  };

  const parsed = reportFilterSchema.safeParse(candidate);
  const filters: ReportFilters = parsed.success ? parsed.data : defaults;

  // A meter id in the URL must belong to the caller; otherwise drop the filter.
  if (filters.meterId && !meters.some((m) => m.id === filters.meterId)) {
    filters.meterId = "";
  }

  const data = await getReport(filters);

  return (
    <div className="space-y-8">
      <PageHeader title={t("reports.title")} description={t("reports.subtitle")} />
      <ReportsView
        meters={meters.map((m) => ({ id: m.id, name: m.name }))}
        filters={filters}
        data={data}
      />
    </div>
  );
}
