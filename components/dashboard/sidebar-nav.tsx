"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS, isNavItemActive } from "./nav-config";

/**
 * The navigation link list, shared by the desktop rail and the mobile drawer.
 *
 * `onNavigate` lets the mobile drawer close itself when a link is tapped; the
 * desktop rail omits it. The admin entry is only rendered when the server has
 * confirmed the caller is a super admin — this is a convenience, not a security
 * control (every /admin route independently calls `requireAdmin`).
 */
export function SidebarNav({
  isAdmin,
  onNavigate,
}: {
  isAdmin: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-6" aria-label={t("nav.main")}>
      {NAV_SECTIONS.map((section) => (
        <div key={section.titleKey} className="space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            {t(section.titleKey)}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
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
      ))}

      {isAdmin && (
        <div className="mt-auto space-y-1 border-t border-border/60 pt-4">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            {t("admin.administration")}
          </p>
          <Link
            href="/admin"
            onClick={onNavigate}
            aria-current={
              isNavItemActive(pathname, { href: "/admin" }) ? "page" : undefined
            }
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isNavItemActive(pathname, { href: "/admin" })
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
            <span>{t("admin.executiveControl")}</span>
          </Link>
        </div>
      )}
    </nav>
  );
}
