"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  Gauge,
  Info,
  WifiOff,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/actions/settings";
import { formatRelativeTime, cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { Notification, NotificationType } from "@/types";

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: LucideIcon; labelKey: TranslationKey; variant: "critical" | "low" | "healthy" | "info" | "secondary" }
> = {
  low_balance: { icon: AlertTriangle, labelKey: "notif.lowBalance", variant: "low" },
  critical_balance: { icon: XCircle, labelKey: "notif.criticalBalance", variant: "critical" },
  recovery: { icon: CheckCircle2, labelKey: "notif.recovery", variant: "healthy" },
  system: { icon: Info, labelKey: "notif.system", variant: "info" },
  monitoring_error: { icon: WifiOff, labelKey: "notif.monitoringError", variant: "secondary" },
};

/**
 * Notification centre.
 *
 * The full list is fetched on the server; this component only filters (all vs.
 * unread) and dispatches the mark-read actions. After a successful action it
 * refreshes so the server-rendered read state and the topbar unread badge stay
 * in sync — the count is never guessed client-side.
 */
export function NotificationsView({
  notifications,
  unreadCount,
}: {
  notifications: Notification[];
  unreadCount: number;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const unread = notifications.filter((n) => !n.read);

  function handleMarkRead(id: string) {
    setBusyId(id);
    startTransition(async () => {
      const result = await markNotificationReadAction(id);
      setBusyId(null);
      if (result.success) {
        router.refresh();
      } else {
        toast.error(t(result.error as TranslationKey));
      }
    });
  }

  function handleMarkAll() {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (result.success) {
        toast.success(t("notif.allMarkedRead"));
        router.refresh();
      } else {
        toast.error(t(result.error as TranslationKey));
      }
    });
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="all">
              {t("notif.all")}
              <Badge variant="secondary" className="ml-2">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              {t("notif.unread")}
              {unreadCount > 0 && (
                <Badge variant="info" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={unreadCount === 0 || pending}
          >
            <CheckCheck className="size-4" aria-hidden="true" />
            {t("notif.markAllRead")}
          </Button>
        </div>

        <TabsContent value="all">
          {notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={t("notif.empty")}
              description={t("notif.emptyDesc")}
            />
          ) : (
            <ul className="space-y-2" aria-label={t("notif.title")}>
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  busy={busyId === notification.id && pending}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="unread">
          {unread.length === 0 ? (
            <EmptyState
              icon={CheckCheck}
              title={t("notif.empty")}
              description={t("notif.emptyDesc")}
            />
          ) : (
            <ul className="space-y-2" aria-label={t("notif.unread")}>
              {unread.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  busy={busyId === notification.id && pending}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationRow({
  notification,
  busy,
  onMarkRead,
}: {
  notification: Notification;
  busy: boolean;
  onMarkRead: (id: string) => void;
}) {
  const { t } = useTranslation();
  const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.system;
  const Icon = config.icon;

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border/60 p-4 transition-colors",
        !notification.read && "border-l-2 border-l-primary bg-primary/[0.03]",
      )}
    >
      <span
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted"
        aria-hidden="true"
      >
        <Icon className="size-4" />
      </span>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{notification.title}</p>
          <Badge variant={config.variant}>{t(config.labelKey)}</Badge>
          {!notification.read && (
            <span className="sr-only">{t("notif.unread")}</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
        <div className="flex items-center gap-3 pt-1">
          <time
            dateTime={notification.created_at}
            className="text-xs text-muted-foreground"
          >
            {formatRelativeTime(notification.created_at)}
          </time>
          {notification.meter_id && (
            <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
              <Link href={`/meters/${notification.meter_id}`}>
                <Gauge className="size-3" aria-hidden="true" />
                {t("reports.meter")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {!notification.read && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMarkRead(notification.id)}
          loading={busy}
          className="shrink-0"
        >
          {!busy && <CheckCircle2 className="size-4" aria-hidden="true" />}
          <span className="sr-only sm:not-sr-only">{t("notif.markRead")}</span>
        </Button>
      )}
    </li>
  );
}
