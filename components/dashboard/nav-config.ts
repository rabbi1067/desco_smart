import {
  LayoutDashboard,
  Gauge,
  BarChart3,
  FileText,
  Bell,
  User,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

/**
 * Single source of truth for the authenticated navigation.
 *
 * Every entry points at a route that actually exists — there are no `href="#"`
 * placeholders. Labels are translation keys, resolved in the rendering layer so
 * the nav is bilingual like the rest of the app.
 */
export interface NavItem {
  href: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  /** Match the pathname exactly rather than by prefix (used for the index route). */
  exact?: boolean;
}

export interface NavSection {
  titleKey: TranslationKey;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    titleKey: "nav.main",
    items: [
      {
        href: "/dashboard",
        labelKey: "nav.dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
      { href: "/meters", labelKey: "nav.myMeters", icon: Gauge },
      { href: "/analytics", labelKey: "nav.analytics", icon: BarChart3 },
      { href: "/reports", labelKey: "nav.reports", icon: FileText },
      { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
    ],
  },
  {
    titleKey: "nav.account",
    items: [
      { href: "/profile", labelKey: "nav.profile", icon: User },
      { href: "/settings", labelKey: "nav.settings", icon: Settings },
    ],
  },
];

/**
 * Decides whether a nav item is the active route.
 * Exact items (the dashboard index) match only themselves; everything else
 * matches its own subtree so `/meters/abc` still highlights "My Meters".
 */
export function isNavItemActive(
  pathname: string,
  item: Pick<NavItem, "href" | "exact">,
): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
