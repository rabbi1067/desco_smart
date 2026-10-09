"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthedUserId, getCurrentProfile, isAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/services/audit";
import {
  appearanceSchema,
  changePasswordSchema,
  notificationPreferencesSchema,
  systemSettingsSchema,
  toFieldErrors,
  updateProfileSchema,
  updateUserRoleSchema,
} from "@/lib/validations";
import type { ActionResult } from "@/types";

// -----------------------------------------------------------------------------
// Profile
// -----------------------------------------------------------------------------
export async function updateProfileAction(
  input: unknown,
): Promise<ActionResult> {
  const userId = await getAuthedUserId();
  if (!userId) return { success: false, error: "error.sessionExpired" };

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "validation.required",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }
  const data = parsed.data;

  const supabase = await createClient();
  // `role` is deliberately absent from this update. Even if it were included,
  // the profiles_update_own RLS policy re-reads the stored role in WITH CHECK
  // and would reject the write.
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.fullName,
      phone: data.phone || null,
      address: data.address || null,
      designation: data.designation || null,
      avatar_url: data.avatarUrl || null,
    })
    .eq("id", userId);

  if (error) return { success: false, error: "error.generic" };

  const profile = await getCurrentProfile();
  await recordAudit({
    userId,
    actorEmail: profile?.email ?? null,
    action: "USER_UPDATED",
    entityType: "profile",
    entityId: userId,
  });

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { success: true, data: undefined, message: "profile.updated" };
}

export async function changePasswordAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "validation.passwordMin",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: "error.sessionExpired" };

  const supabase = await createClient();

  // Re-authenticate with the current password before allowing a change.
  // Without this, a stolen session cookie could change the password and lock
  // the real owner out.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: parsed.data.currentPassword,
  });
  if (reauthError) {
    return {
      success: false,
      error: "auth.invalidCredentials",
      fieldErrors: { currentPassword: ["auth.invalidCredentials"] },
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) return { success: false, error: "error.generic" };

  await recordAudit({
    userId: profile.id,
    actorEmail: profile.email,
    action: "USER_UPDATED",
    entityType: "auth",
    metadata: { field: "password" },
  });

  return { success: true, data: undefined, message: "auth.passwordUpdated" };
}

// -----------------------------------------------------------------------------
// Preferences
// -----------------------------------------------------------------------------
export async function updateAppearanceAction(
  input: unknown,
): Promise<ActionResult> {
  const userId = await getAuthedUserId();
  if (!userId) return { success: false, error: "error.sessionExpired" };

  const parsed = appearanceSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "error.generic" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ theme: parsed.data.theme, language: parsed.data.language })
    .eq("id", userId);

  if (error) return { success: false, error: "error.generic" };

  revalidatePath("/settings");
  return { success: true, data: undefined, message: "settings.saved" };
}

export async function updateNotificationPreferencesAction(
  input: unknown,
): Promise<ActionResult> {
  const userId = await getAuthedUserId();
  if (!userId) return { success: false, error: "error.sessionExpired" };

  const parsed = notificationPreferencesSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "error.generic" };
  const data = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: userId,
      email_alerts: data.emailAlerts,
      low_balance: data.lowBalance,
      critical_balance: data.criticalBalance,
      recovery_alerts: data.recoveryAlerts,
      daily_summary: data.dailySummary,
    },
    { onConflict: "user_id" },
  );

  if (error) return { success: false, error: "error.generic" };

  revalidatePath("/settings");
  return { success: true, data: undefined, message: "settings.saved" };
}

// -----------------------------------------------------------------------------
// Notifications
// -----------------------------------------------------------------------------
export async function markNotificationReadAction(
  notificationId: string,
): Promise<ActionResult> {
  const userId = await getAuthedUserId();
  if (!userId) return { success: false, error: "error.sessionExpired" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) return { success: false, error: "error.generic" };

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { success: true, data: undefined, message: "notif.markedRead" };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const userId = await getAuthedUserId();
  if (!userId) return { success: false, error: "error.sessionExpired" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) return { success: false, error: "error.generic" };

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { success: true, data: undefined, message: "notif.allMarkedRead" };
}

// -----------------------------------------------------------------------------
// Admin
// -----------------------------------------------------------------------------
export async function updateUserRoleAction(
  input: unknown,
): Promise<ActionResult> {
  // Authorisation is checked BEFORE the service-role client is constructed.
  if (!(await isAdmin())) {
    return { success: false, error: "error.unauthorized" };
  }

  const parsed = updateUserRoleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "error.generic" };

  const actor = await getCurrentProfile();
  if (!actor) return { success: false, error: "error.sessionExpired" };

  // An admin must not be able to demote themselves — that could leave the
  // system with zero administrators and no way back in.
  if (parsed.data.userId === actor.id) {
    return { success: false, error: "admin.users.cannotDemoteSelf" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.userId);

  if (error) return { success: false, error: "error.generic" };

  await recordAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: "USER_UPDATED",
    entityType: "profile",
    entityId: parsed.data.userId,
    metadata: { role: parsed.data.role },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/settings");
  return { success: true, data: undefined, message: "admin.users.roleUpdated" };
}

export async function updateSystemSettingsAction(
  input: unknown,
): Promise<ActionResult> {
  if (!(await isAdmin())) {
    return { success: false, error: "error.unauthorized" };
  }

  const parsed = systemSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "validation.required",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }
  const data = parsed.data;

  if (data.defaultCriticalThreshold >= data.defaultLowThreshold) {
    return {
      success: false,
      error: "validation.thresholdOrder",
      fieldErrors: {
        defaultCriticalThreshold: ["validation.thresholdOrder"],
      },
    };
  }

  const actor = await getCurrentProfile();
  const supabase = createAdminClient();

  const rows = [
    { key: "default_low_threshold", value: String(data.defaultLowThreshold) },
    {
      key: "default_critical_threshold",
      value: String(data.defaultCriticalThreshold),
    },
    { key: "alert_cooldown_hours", value: String(data.alertCooldownHours) },
    { key: "maintenance_mode", value: String(data.maintenanceMode) },
    { key: "default_language", value: data.defaultLanguage },
    { key: "default_theme", value: data.defaultTheme },
  ];

  for (const row of rows) {
    const { error } = await supabase
      .from("system_settings")
      .update({ value: row.value, updated_at: new Date().toISOString() })
      .eq("key", row.key);
    if (error) return { success: false, error: "error.generic" };
  }

  await recordAudit({
    userId: actor?.id ?? null,
    actorEmail: actor?.email ?? null,
    action: "SETTINGS_UPDATED",
    entityType: "system_settings",
    metadata: { keys: rows.map((r) => r.key) },
  });

  revalidatePath("/admin/settings");
  return { success: true, data: undefined, message: "admin.settings.saved" };
}
