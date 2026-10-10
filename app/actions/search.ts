"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth";

export interface SearchResultItem {
  id: string;
  type: "meter" | "user" | "route";
  title: string;
  subtitle: string;
  badge?: string;
  url: string;
}

export async function searchAdminDirectoryAction(
  query: string,
): Promise<{ success: boolean; results: SearchResultItem[] }> {
  try {
    if (!(await isAdmin())) {
      return { success: false, results: [] };
    }

    const q = query.trim();
    if (!q) {
      return { success: true, results: [] };
    }

    const supabase = createAdminClient();
    const results: SearchResultItem[] = [];

    // 1. Search Static Admin Routes
    const adminRoutes = [
      {
        title: "Executive Overview",
        subtitle: "Enterprise telemetry & balance overview",
        url: "/admin",
        keywords: "overview dashboard telemetry home fleet control orbitadmin",
      },
      {
        title: "Fleet & Grid Directory",
        subtitle: "Inspect & manage all DESCO meters",
        url: "/admin/meters",
        keywords: "meters fleet grid meters account balance threshold",
      },
      {
        title: "Consumers & Accounts",
        subtitle: "User access, roles, and management",
        url: "/admin/users",
        keywords: "users consumers customers accounts roles permissions",
      },
      {
        title: "Email & SMTP Gateway",
        subtitle: "Configure alert sender and App Password",
        url: "/admin/email",
        keywords: "email smtp password gateway alert mail notify",
      },
      {
        title: "System Audit Logs",
        subtitle: "Security and operational audit trail",
        url: "/admin/audit-logs",
        keywords: "audit logs security trail history access activity",
      },
      {
        title: "System Settings",
        subtitle: "Default thresholds & global configurations",
        url: "/admin/settings",
        keywords: "settings system config thresholds maintenance cooldown",
      },
      {
        title: "Fleet Analytics & Reports",
        subtitle: "Usage consumption and burn rate trends",
        url: "/admin/analytics",
        keywords: "analytics reports charts trends consumption graph",
      },
    ];

    const qLower = q.toLowerCase();
    for (const route of adminRoutes) {
      if (
        route.title.toLowerCase().includes(qLower) ||
        route.subtitle.toLowerCase().includes(qLower) ||
        route.keywords.includes(qLower)
      ) {
        results.push({
          id: `route-${route.url}`,
          type: "route",
          title: route.title,
          subtitle: route.subtitle,
          badge: "NAVIGATION",
          url: route.url,
        });
      }
    }

    // 2. Search Meters
    const { data: meters } = await supabase
      .from("meters")
      .select("id, name, meter_number, account_number, current_balance, status, owner:profiles!meters_user_id_fkey(full_name, email)")
      .or(
        `name.ilike.%${q}%,meter_number.ilike.%${q}%,account_number.ilike.%${q}%`,
      )
      .limit(6);

    if (meters) {
      for (const m of meters) {
        const owner = m.owner as { full_name?: string; email?: string } | null;
        const ownerName = owner?.full_name || owner?.email || "Unknown user";
        const balance =
          m.current_balance !== null
            ? `৳${m.current_balance.toLocaleString("en-BD", { minimumFractionDigits: 1 })}`
            : "No balance";

        results.push({
          id: `meter-${m.id}`,
          type: "meter",
          title: `${m.name} (${m.meter_number})`,
          subtitle: `A/C: ${m.account_number} · Owner: ${ownerName} · Balance: ${balance}`,
          badge: (m.status || "METER").toUpperCase(),
          url: `/admin/meters?q=${encodeURIComponent(m.meter_number)}`,
        });
      }
    }

    // 3. Search Users / Consumers
    const { data: users } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, is_active")
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(5);

    if (users) {
      for (const u of users) {
        results.push({
          id: `user-${u.id}`,
          type: "user",
          title: u.full_name || u.email,
          subtitle: `${u.email} · ${u.is_active ? "Active" : "Suspended"}`,
          badge: (u.role || "USER").toUpperCase(),
          url: `/admin/users?q=${encodeURIComponent(u.email)}`,
        });
      }
    }

    return { success: true, results };
  } catch (err) {
    console.error("[searchAdminDirectoryAction] Search failed:", err);
    return { success: false, results: [] };
  }
}
