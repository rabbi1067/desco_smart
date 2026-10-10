"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { isNavItemActive } from "@/components/dashboard/nav-config";
import { ADMIN_NAV_SECTIONS } from "./admin-nav-config";

export function AdminNav({
  isSuperAdmin = true,
  onNavigate,
}: {
  isSuperAdmin?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-6" aria-label={t("admin.administration")}>
      {ADMIN_NAV_SECTIONS.map((section) => {
        const visibleItems = section.items.filter(
          (item) => !item.superAdminOnly || isSuperAdmin,
        );
        if (visibleItems.length === 0) return null;

        return (
          <div key={section.title} className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {visibleItems.map((item) => {
                const active = isNavItemActive(pathname, item);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                        active
                          ? "bg-emerald-500/10 text-emerald-400 font-semibold border-l-2 border-emerald-500 shadow-sm"
                          : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200",
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", active ? "text-emerald-400" : "text-gray-400")} aria-hidden="true" />
                      <span>{t(item.labelKey)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
