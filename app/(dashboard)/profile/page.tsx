import type { Metadata } from "next";
import { CalendarDays, Gauge, Mail, ShieldCheck } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { getMeterCount } from "@/lib/services/meters";
import { getServerTranslator } from "@/lib/i18n/server";
import { formatDate, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/profile/profile-form";
import { PasswordForm } from "@/components/profile/password-form";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const [profile, meterCount] = await Promise.all([
    requireProfile(),
    getMeterCount(),
  ]);
  const { t } = await getServerTranslator();

  const roleLabel =
    profile.role === "super_admin"
      ? t("admin.superAdmin")
      : t("admin.audit.user");

  const summaryItems = [
    { icon: Mail, label: t("profile.email"), value: profile.email },
    {
      icon: CalendarDays,
      label: t("profile.memberSince"),
      value: formatDate(profile.created_at),
    },
    {
      icon: Gauge,
      label: t("profile.linkedMeters"),
      value: formatNumber(meterCount),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title={t("profile.title")} description={t("profile.subtitle")} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Account details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("profile.accountDetails")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={profile} uploadEnabled={isCloudinaryConfigured()} />
          </CardContent>
        </Card>

        {/* Identity summary (read-only) */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              {t("profile.role")}
            </CardTitle>
            <CardDescription>{roleLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge
              variant={profile.role === "super_admin" ? "info" : "secondary"}
              className="mb-4"
            >
              {roleLabel}
            </Badge>
            <dl className="space-y-4">
              {summaryItems.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <item.icon
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{item.label}</dt>
                    <dd className="truncate text-sm font-medium">{item.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Password & security */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.security")}</CardTitle>
          <CardDescription>{t("profile.securityDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="max-w-md">
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
