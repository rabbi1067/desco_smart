import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getAuthedUserId } from "@/lib/auth";
import type { Notification, NotificationPreferences } from "@/types";

export async function getNotifications(limit = 50): Promise<Notification[]> {
  const userId = await getAuthedUserId();
  if (!userId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[notifications] fetch failed:", error.message);
    return [];
  }
  return (data ?? []) as Notification[];
}

/** Drives the topbar badge. Uses a HEAD count — no rows transferred. */
export async function getUnreadCount(): Promise<number> {
  const userId = await getAuthedUserId();
  if (!userId) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) return 0;
  return count ?? 0;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const userId = await getAuthedUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as NotificationPreferences;
}
