import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUserId } from "@/lib/auth";
import type { Notification, NotificationPreferences } from "@/types";

/**
 * Automatically syncs meter low/critical states into the in-app notifications
 * table, batched efficiently in 2 queries instead of looping roundtrips.
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

    // Fetch existing recent notifications in a single batch
    const { data: existingNotifs } = await supabase
      .from("notifications")
      .select("type, link")
      .eq("user_id", userId)
      .gte("created_at", twentyFourHoursAgo);

    const existingKeys = new Set(
      (existingNotifs ?? []).map((n) => `${n.type}:${n.link}`),
    );

    const toInsert: Array<{
      user_id: string;
      title: string;
      message: string;
      type: "low_balance" | "critical_balance";
      read: boolean;
      link: string;
      metadata: Record<string, unknown>;
    }> = [];

    for (const meter of meters) {
      if (!meter.monitoring_enabled || meter.current_balance === null || meter.status === "disabled") {
        continue;
      }

      const balance = Number(meter.current_balance);
      const threshold = Number(meter.threshold);
      const criticalThreshold = Number(meter.critical_threshold);
      const meterLink = `/meters/${meter.id}`;

      if (balance <= criticalThreshold) {
        const key = `critical_balance:${meterLink}`;
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          toInsert.push({
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
        const key = `low_balance:${meterLink}`;
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          toInsert.push({
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

    if (toInsert.length > 0) {
      await supabase.from("notifications").insert(toInsert);
    }
  } catch (err) {
    console.error("[notifications] syncMeterNotifications threw:", err);
  }
}

export const getNotifications = cache(async (limit = 50): Promise<Notification[]> => {
  const userId = await getAuthedUserId();
  if (!userId) return [];

  // Run notification sync before fetching latest list
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
});

/** Drives the topbar badge. Uses a lightweight HEAD count — no rows transferred. */
export const getUnreadCount = cache(async (): Promise<number> => {
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
});

export const getNotificationPreferences = cache(
  async (): Promise<NotificationPreferences | null> => {
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
  },
);
