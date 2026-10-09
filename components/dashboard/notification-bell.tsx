"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

/**
 * Topbar notification bell with an unread badge.
 *
 * The count is computed on the server (a HEAD count, no rows transferred) and
 * passed in, so this component is purely presentational. It links to the full
 * notifications page rather than opening a popover — one place to manage alerts.
 */
export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const { t } = useTranslation();
  const hasUnread = unreadCount > 0;
  const label = hasUnread
    ? `${t("notif.openNotifications")} (${unreadCount} ${t("notif.unreadCount")})`
    : t("notif.openNotifications");

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={label}
    >
      <Link href="/notifications">
        <Bell className="size-4" aria-hidden="true" />
        {hasUnread && (
          <span
            className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-destructive-foreground tabular"
            aria-hidden="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>
    </Button>
  );
}
