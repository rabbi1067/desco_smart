import type { Metadata } from "next";
import { getAllMeters } from "@/lib/services/admin";
import { getServerTranslator } from "@/lib/i18n/server";
import { formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { AdminMetersTable } from "@/components/admin/admin-meters-table";

export const metadata: Metadata = {
  title: "Meter Management",
};

export default async function AdminMetersPage() {
  const meters = await getAllMeters();
  const { t } = await getServerTranslator();

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("admin.meters.title")}
        description={t("admin.meters.subtitle")}
        action={
          <Badge variant="secondary" className="h-7">
            {formatNumber(meters.length)} · {t("admin.meters.configured")}
          </Badge>
        }
      />
      <AdminMetersTable meters={meters} />
    </div>
  );
}
