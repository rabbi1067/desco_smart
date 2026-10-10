import type { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/auth";
import { getSmtpSettings } from "@/lib/services/smtp";
import { getServerTranslator } from "@/lib/i18n/server";
import { PageHeader } from "@/components/shared/page-header";
import { AdminEmailForm } from "@/components/admin/admin-email-form";
import type { SmtpSettings } from "@/types";

export const metadata: Metadata = {
  title: "Email Gateway Configuration",
};

export default async function AdminEmailPage() {
  const profile = await requireSuperAdmin();
  const [rawSettings, { t }] = await Promise.all([
    getSmtpSettings(),
    getServerTranslator(),
  ]);

  // Security: Never transmit the stored SMTP App Password to the client browser!
  const safeSettings: SmtpSettings = {
    ...rawSettings,
    pass: "", // Kept blank for security
    hasPassword: Boolean(rawSettings.pass),
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("admin.email.title")}
        description={t("admin.email.subtitle")}
      />
      <AdminEmailForm
        settings={safeSettings}
        adminEmail={profile.email}
      />
    </div>
  );
}
