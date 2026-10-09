import type { Metadata } from "next";
import { getAuditLogs } from "@/lib/services/admin";
import { getServerTranslator } from "@/lib/i18n/server";
import { PageHeader } from "@/components/shared/page-header";
import { AdminAuditTable } from "@/components/admin/admin-audit-table";

export const metadata: Metadata = {
  title: "Audit Logs",
};

export default async function AdminAuditLogsPage() {
  const logs = await getAuditLogs(200);
  const { t } = await getServerTranslator();

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("admin.audit.title")}
        description={t("admin.audit.subtitle")}
      />
      <AdminAuditTable logs={logs} />
    </div>
  );
}
