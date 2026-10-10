import type { Metadata } from "next";
import { getServerTranslator } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/auth";
import { getMeters } from "@/lib/services/meters";
import { getReport } from "@/lib/services/reports";
import { getRechargeHistory, type DescoRecharge } from "@/lib/services/desco";
import { reportFilterSchema } from "@/lib/validations";
import { toISODate, daysAgo } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { ReportsView } from "@/components/reports/reports-view";
import type { ReportFilters } from "@/types";

export const metadata: Metadata = {
  title: "Reports & Invoices",
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
    tab?: string;
  }>;
}) {
  const { t } = await getServerTranslator();
  const params = await searchParams;

  const [profile, meters] = await Promise.all([
    getCurrentProfile(),
    getMeters(),
  ]);

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

  // Fetch telemetry report data
  const data = await getReport(filters);

  // Fetch recharge history for the selected meter or first meter in the fleet
  const activeMeter = filters.meterId
    ? meters.find((m) => m.id === filters.meterId)
    : meters[0];

  let recharges: DescoRecharge[] = [];
  if (activeMeter) {
    const rechargeResult = await getRechargeHistory(
      activeMeter.account_number,
      activeMeter.meter_number,
      filters.dateFrom,
      filters.dateTo,
    );
    if (rechargeResult.ok) {
      recharges = rechargeResult.data;
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${t("reports.title")} & Invoices / রিপোর্ট ও ইনভয়েস`}
        description={t("reports.subtitle")}
      />
      <ReportsView
        profile={profile}
        meters={meters}
        filters={filters}
        data={data}
        recharges={recharges}
        initialTab={params.tab || "invoice"}
      />
    </div>
  );
}
