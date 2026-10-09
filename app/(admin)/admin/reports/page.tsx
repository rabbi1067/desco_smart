import type { Metadata } from "next";
import { getRecentReadings, getRecentAlerts } from "@/lib/services/admin";
import { getServerTranslator } from "@/lib/i18n/server";
import { PageHeader } from "@/components/shared/page-header";
import { AdminLedger } from "@/components/admin/admin-ledger";

export const metadata: Metadata = {
  title: "Reports & Ledger",
};

export default async function AdminReportsPage() {
  const [readings, alerts] = await Promise.all([
    getRecentReadings(100),
    getRecentAlerts(100),
  ]);
  const { t } = await getServerTranslator();

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("admin.reports.title")}
        description={t("admin.reports.subtitle")}
      />
      <AdminLedger readings={readings} alerts={alerts} />
    </div>
  );
}
