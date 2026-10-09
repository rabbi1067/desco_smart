import type { Metadata } from "next";
import { BellRing, Palette } from "lucide-react";
import { getNotificationPreferences } from "@/lib/services/notifications";
import { getServerTranslator } from "@/lib/i18n/server";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  // RLS-scoped: resolves the signed-in user internally. Null means the user has
  // never saved preferences, which the form treats as "all channels on".
  const preferences = await getNotificationPreferences();
  const { t } = await getServerTranslator();

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("settings.title")}
        description={t("settings.subtitle")}
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-5 text-primary" aria-hidden="true" />
              {t("settings.appearance")}
            </CardTitle>
            <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <AppearanceSettings />
          </CardContent>
        </Card>

        {/* Notification preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="size-5 text-primary" aria-hidden="true" />
              {t("settings.notifications")}
            </CardTitle>
            <CardDescription>{t("settings.notificationsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationSettings preferences={preferences} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
