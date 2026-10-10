"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Info,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslation } from "@/lib/i18n";
import { formatRelativeTime } from "@/lib/utils";
import { markAllNotificationsReadAction } from "@/app/actions/settings";
import type { Notification } from "@/types";

export function NotificationBell({
  unreadCount,
  notifications = [],
}: {
  unreadCount: number;
  notifications?: Notification[];
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [localUnread, setLocalUnread] = useState(unreadCount);

  const hasUnread = localUnread > 0;
  const label = hasUnread
    ? `${t("notif.openNotifications")} (${localUnread} ${t("notif.unreadCount")})`
    : t("notif.openNotifications");

  async function handleMarkAllRead() {
    setPending(true);
    const result = await markAllNotificationsReadAction();
    setPending(false);
    if (result.success) {
      setLocalUnread(0);
      toast.success(t("notif.allMarkedRead"));
    }
  }

  function renderNotificationIcon(type: Notification["type"]) {
    switch (type) {
      case "critical_balance":
        return <XCircle className="size-4 shrink-0 text-destructive" />;
      case "low_balance":
        return <AlertTriangle className="size-4 shrink-0 text-amber-500" />;
      case "recovery":
        return <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />;
      default:
        return <Info className="size-4 shrink-0 text-primary" />;
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-foreground hover:bg-accent"
          aria-label={label}
        >
          <Bell className="size-4.5" aria-hidden="true" />
          {hasUnread && (
            <span
              className="absolute -right-0.5 -top-0.5 grid min-w-4.5 h-4.5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground tabular animate-pulse shadow-sm"
              aria-hidden="true"
            >
              {localUnread > 99 ? "99+" : localUnread}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 sm:w-96 p-0 shadow-xl border border-border/80 bg-card text-card-foreground"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 p-3.5 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Notifications</span>
            {hasUnread && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">
                {localUnread} new
              </span>
            )}
          </div>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={pending}
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications list */}
        <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <CheckCircle2 className="size-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                No active meter alerts or unread notifications.
              </p>
            </div>
          ) : (
            notifications.slice(0, 6).map((notif) => (
              <Link
                key={notif.id}
                href={notif.meter_id ? `/meters/${notif.meter_id}` : "/notifications"}
                onClick={() => setOpen(false)}
                className={`flex items-start gap-3 p-3.5 transition-colors hover:bg-accent/40 ${
                  !notif.read ? "bg-primary/5" : ""
                }`}
              >
                <div className="mt-0.5">{renderNotificationIcon(notif.type)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p
                      className={`truncate text-xs font-semibold ${
                        !notif.read ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground/80 shrink-0">
                      {formatRelativeTime(notif.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {notif.message}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 p-2.5 bg-muted/20 text-center">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline underline-offset-4"
          >
            <span>View all notifications</span>
            <ExternalLink className="size-3" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
