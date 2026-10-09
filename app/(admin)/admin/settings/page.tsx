import type { Metadata } from "next";
import {
  AlertTriangle,
  CalendarClock,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
} from "lucide-react";
import { getAdmins, getSettingsMap } from "@/lib/services/admin";
import { getServerTranslator } from "@/lib/i18n/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SystemSettingsForm } from "@/components/admin/system-settings-form";

export const metadata: Metadata = {
  title: "System Settings",
};

export default async function AdminSettingsPage() {
  const [settings, admins] = await Promise.all([getSettingsMap(), getAdmins()]);
  const { t } = await getServerTranslator();

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("admin.settings.title")}
        description={t("admin.settings.subtitle")}
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Editable global parameters */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <SlidersHorizontal
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
              <CardTitle className="text-base">
                {t("admin.settings.defaults")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <SystemSettingsForm settings={settings} />
          </CardContent>
        </Card>

        {/* Read-only monitoring schedule — owned by the workflow file, not this UI */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarClock
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
              <CardTitle className="text-base">
                {t("admin.settings.schedule")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant="info">{t("admin.settings.scheduleValue")}</Badge>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("admin.settings.scheduleNotice")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Administrator governance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <CardTitle className="text-base">
                {t("admin.governance.currentAdmins")}
              </CardTitle>
              <CardDescription>
                {t("admin.governance.subtitle")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {admins.length === 0 ? (
            <EmptyState
              icon={UserCog}
              title={t("admin.governance.noAdmins")}
              description={t("admin.governance.noAdminsDesc")}
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {admins.map((admin) => (
                <li
                  key={admin.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {admin.full_name || admin.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {admin.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {admin.designation && (
                      <span className="text-xs text-muted-foreground">
                        {admin.designation}
                      </span>
                    )}
                    <Badge variant="healthy">
                      <ShieldCheck className="size-3" aria-hidden="true" />
                      {t("admin.superAdmin")}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-start gap-2 rounded-lg border border-low/30 bg-low/5 p-3">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-low-foreground"
              aria-hidden="true"
            />
            <p className="text-xs text-muted-foreground">
              {t("admin.governance.warning")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
