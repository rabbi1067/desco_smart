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

/**
 * Single source of truth for the Super Admin navigation.
 *
 * Every entry resolves to a real route under `app/(admin)/` — no `href="#"`
 * placeholders. Labels are translation keys resolved in the rendering layer, so
 * the admin shell is bilingual like the rest of the app.
 */
export interface AdminNavItem {
  href: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  /** Match the pathname exactly rather than by prefix (used for the index route). */
  exact?: boolean;
  /** Only visible to Super Admins (hidden from sub-admins) */
  superAdminOnly?: boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", labelKey: "admin.fleetOverview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", labelKey: "admin.usersDirectory", icon: Users },
  { href: "/admin/meters", labelKey: "admin.meterManagement", icon: Gauge },
  { href: "/admin/analytics", labelKey: "admin.analytics.title", icon: BarChart3 },
  { href: "/admin/reports", labelKey: "admin.reportsLedger", icon: FileText },
  { href: "/admin/notifications", labelKey: "admin.notif.title", icon: Bell },
  { href: "/admin/audit-logs", labelKey: "admin.auditLogs", icon: ScrollText },
  { href: "/admin/email", labelKey: "admin.emailConfig", icon: Mail, superAdminOnly: true },
  { href: "/admin/settings", labelKey: "admin.systemSettings", icon: Settings, superAdminOnly: true },
];
