import type { Metadata } from "next";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  WifiOff,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { getSystemNotifications } from "@/lib/services/admin";
import { getServerTranslator } from "@/lib/i18n/server";
import { formatRelativeTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { NotificationType } from "@/types";

export const metadata: Metadata = {
  title: "System Notifications",
};

const TYPE_CONFIG: Record<
  NotificationType,
  {
    icon: LucideIcon;
    labelKey: TranslationKey;
    variant: "critical" | "low" | "healthy" | "info" | "secondary";
  }
> = {
  low_balance: { icon: AlertTriangle, labelKey: "notif.lowBalance", variant: "low" },
  critical_balance: { icon: XCircle, labelKey: "notif.criticalBalance", variant: "critical" },
  recovery: { icon: CheckCircle2, labelKey: "notif.recovery", variant: "healthy" },
  system: { icon: Info, labelKey: "notif.system", variant: "info" },
  monitoring_error: { icon: WifiOff, labelKey: "notif.monitoringError", variant: "secondary" },
};

export default async function AdminNotificationsPage() {
  const notifications = await getSystemNotifications();
  const { t } = await getServerTranslator();

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("admin.notif.title")}
        description={t("admin.notif.subtitle")}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.notif.recent")}</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={t("notif.empty")}
              description={t("notif.emptyDesc")}
            />
          ) : (
            <ul className="space-y-2" aria-label={t("admin.notif.recent")}>
              {notifications.map((n) => {
                const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system;
                const Icon = config.icon;
                return (
                  <li
                    key={n.id}
                    className="flex items-start gap-3 rounded-lg border border-border/60 p-4"
                  >
                    <span
                      className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted"
                      aria-hidden="true"
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{n.title}</p>
                        <Badge variant={config.variant}>
                          {t(config.labelKey)}
                        </Badge>
                        {!n.read && (
                          <span
                            className="size-1.5 rounded-full bg-primary"
                            aria-label={t("notif.unread")}
                          />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {n.message}
                      </p>
                      <time
                        dateTime={n.created_at}
                        className="text-xs text-muted-foreground"
                      >
                        {formatRelativeTime(n.created_at)}
                      </time>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
