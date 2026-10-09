"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { isNavItemActive } from "@/components/dashboard/nav-config";
import { ADMIN_NAV_ITEMS } from "./admin-nav-config";

/**
 * Admin navigation list, shared by the desktop rail and the mobile drawer.
 *
 * `onNavigate` lets the mobile drawer close itself when a link is tapped. This
 * is a convenience surface only — every /admin route independently calls
 * `requireAdmin`, so hiding or showing links is never the security boundary.
 */
export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-6" aria-label={t("admin.administration")}>
      <div className="space-y-1">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          {t("admin.executiveControl")}
        </p>
        <ul className="space-y-0.5">
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = isNavItemActive(pathname, item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span>{t(item.labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Escape hatch back to the standard user app. */}
      <div className="mt-auto border-t border-border/60 pt-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            "text-muted-foreground hover:bg-accent hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
          <span>{t("admin.backToUserDashboard")}</span>
        </Link>
      </div>
    </nav>
  );
}
