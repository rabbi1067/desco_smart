import type { Metadata } from "next";
import { getServerTranslator } from "@/lib/i18n/server";
import { getNotifications, getUnreadCount } from "@/lib/services/notifications";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  const { t } = await getServerTranslator();
  const [notifications, unreadCount] = await Promise.all([
    getNotifications(),
    getUnreadCount(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title={t("notif.title")} description={t("notif.subtitle")} />
      <NotificationsView
        notifications={notifications}
        unreadCount={unreadCount}
      />
    </div>
  );
}
