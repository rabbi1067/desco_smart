import {
  LayoutDashboard,
  Users,
  Gauge,
  BarChart3,
  FileText,
  Bell,
  ScrollText,
  Mail,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

export interface AdminNavItem {
  href: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  exact?: boolean;
  superAdminOnly?: boolean;
}

export interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { href: "/admin", labelKey: "admin.fleetOverview", icon: LayoutDashboard, exact: true },
      { href: "/admin/reports", labelKey: "admin.reportsLedger", icon: FileText },
    ],
  },
  {
    title: "FLEET & GRID",
    items: [
      { href: "/admin/meters", labelKey: "admin.meterManagement", icon: Gauge },
      { href: "/admin/analytics", labelKey: "admin.analytics.title", icon: BarChart3 },
    ],
  },
  {
    title: "CONSUMERS & ACCESS",
    items: [
      { href: "/admin/users", labelKey: "admin.usersDirectory", icon: Users },
      { href: "/admin/audit-logs", labelKey: "admin.auditLogs", icon: ScrollText },
    ],
  },
  {
    title: "SYSTEM & RELAY",
    items: [
      { href: "/admin/email", labelKey: "admin.emailConfig", icon: Mail, superAdminOnly: true },
      { href: "/admin/notifications", labelKey: "admin.notif.title", icon: Bell },
      { href: "/admin/settings", labelKey: "admin.systemSettings", icon: Settings, superAdminOnly: true },
    ],
  },
];

// Flat list for backwards compatibility
export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_SECTIONS.flatMap((s) => s.items);
