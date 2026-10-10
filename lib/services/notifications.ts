import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getAuthedUserId } from "@/lib/auth";
import type { Notification, NotificationPreferences } from "@/types";

/**
 * Automatically syncs meter low/critical states into the in-app notifications
 * table, so users see active alerts immediately without relying solely on the worker.
 */
export async function syncMeterNotifications(): Promise<void> {
  try {
    const userId = await getAuthedUserId();
    if (!userId) return;

    const supabase = await createClient();
    const { data: meters, error: metersError } = await supabase
      .from("meters")
      .select("id, name, meter_number, current_balance, threshold, critical_threshold, status, monitoring_enabled")
      .eq("user_id", userId);

    if (metersError || !meters || meters.length === 0) return;

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    for (const meter of meters) {
      if (!meter.monitoring_enabled || meter.current_balance === null || meter.status === "disabled") {
        continue;
      }

      const balance = Number(meter.current_balance);
      const threshold = Number(meter.threshold);
      const criticalThreshold = Number(meter.critical_threshold);
      const meterLink = `/meters/${meter.id}`;

      if (balance <= criticalThreshold) {
        // Check if an alert was already generated in the last 24h for this specific meter
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", userId)
          .eq("type", "critical_balance")
          .eq("link", meterLink)
          .gte("created_at", twentyFourHoursAgo)
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from("notifications").insert({
            user_id: userId,
            title: `Critical Balance: ${meter.name}`,
            message: `Emergency: Balance is only ৳${balance.toFixed(2)} (Critical limit: ৳${criticalThreshold}). Electricity cutoff is imminent. Please recharge now!`,
            type: "critical_balance",
            read: false,
            link: meterLink,
            metadata: { meter_id: meter.id, balance },
          });
        }
      } else if (balance <= threshold) {
        // Check if an alert was already generated in the last 24h for this specific meter
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", userId)
          .eq("type", "low_balance")
          .eq("link", meterLink)
          .gte("created_at", twentyFourHoursAgo)
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from("notifications").insert({
            user_id: userId,
            title: `Low Balance Alert: ${meter.name}`,
            message: `Attention: Remaining balance is ৳${balance.toFixed(2)}, below your low limit of ৳${threshold}. Consider recharging soon.`,
            type: "low_balance",
            read: false,
            link: meterLink,
            metadata: { meter_id: meter.id, balance },
          });
        }
      }
    }
  } catch (err) {
    console.error("[notifications] syncMeterNotifications threw:", err);
  }
}

export async function getNotifications(limit = 50): Promise<Notification[]> {
  const userId = await getAuthedUserId();
  if (!userId) return [];

  await syncMeterNotifications();

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

  await syncMeterNotifications();

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
