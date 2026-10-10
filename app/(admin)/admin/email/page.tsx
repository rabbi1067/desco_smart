import type { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/auth";
import { getSmtpSettings } from "@/lib/services/smtp";
import { getServerTranslator } from "@/lib/i18n/server";
import { PageHeader } from "@/components/shared/page-header";
import { AdminEmailForm } from "@/components/admin/admin-email-form";

export const metadata: Metadata = {
  title: "Email Gateway Configuration",
};

export default async function AdminEmailPage() {
  const profile = await requireSuperAdmin();
  const [settings, { t }] = await Promise.all([
    getSmtpSettings(),
    getServerTranslator(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("admin.email.title")}
        description={t("admin.email.subtitle")}
      />
      <AdminEmailForm
        settings={settings}
        adminEmail={profile.email}
      />
    </div>
  );
}
