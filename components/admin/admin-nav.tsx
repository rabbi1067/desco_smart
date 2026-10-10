"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
export function AdminNav({
  isSuperAdmin = true,
  onNavigate,
}: {
  isSuperAdmin?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const navItems = ADMIN_NAV_ITEMS.filter(
    (item) => !item.superAdminOnly || isSuperAdmin,
  );

  return (
    <nav className="flex flex-1 flex-col gap-6" aria-label={t("admin.administration")}>
      <div className="space-y-1">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          {t("admin.executiveControl")}
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
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
    </nav>
  );
}
