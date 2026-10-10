"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUserId, getCurrentProfile } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { recordAudit } from "@/lib/services/audit";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  toFieldErrors,
} from "@/lib/validations";
import type { ActionResult } from "@/types";

/**
 * Authentication server actions.
 *
 * Error handling policy: Supabase's raw auth errors are mapped to generic
 * translation keys. "Incorrect email or password" is returned for every
 * credential failure so the response cannot be used to enumerate which emails
 * are registered.
 */

export async function loginAction(
  input: unknown,
): Promise<ActionResult<{ defaultRedirect: string }>> {
  // Throttle credential-guessing per client IP before touching Supabase Auth.
  const ip = await getClientIp();
  if (!rateLimit(`login:${ip}`, 10, 60_000).ok) {
    return { success: false, error: "error.rateLimited" };
  }

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "validation.required",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    const raw = (error?.message ?? "no-user").toLowerCase();
    console.error("[auth] signIn failed:", error?.message ?? "no user");
    if (raw.includes("email not confirmed") || raw.includes("not confirmed")) {
      return { success: false, error: "auth.emailNotConfirmed" };
    }
    if (
      raw.includes("fetch failed") ||
      raw.includes("failed to fetch") ||
      raw.includes("network")
    ) {
      return { success: false, error: "error.networkUnreachable" };
    }
    return { success: false, error: "auth.invalidCredentials" };
  }

  await recordAudit({
    userId: data.user.id,
    actorEmail: data.user.email ?? null,
    action: "LOGIN",
    entityType: "auth",
  });

  // Query profile role to route admins straight to /admin and regular users to /dashboard
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = profile?.role ?? "user";
  const defaultRedirect =
    role === "admin" || role === "super_admin" ? "/admin" : "/dashboard";

  revalidatePath("/", "layout");
  return {
    success: true,
    data: { defaultRedirect },
    message: "auth.loginSuccess",
  };
}

export async function registerAction(
  input: unknown,
): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  // New-account creation is far rarer than login — a tighter cap per IP.
  const ip = await getClientIp();
  if (!rateLimit(`register:${ip}`, 5, 60_000).ok) {
    return { success: false, error: "error.rateLimited" };
  }

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "validation.required",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // full_name is the ONLY thing put in user metadata. The DB trigger
      // hardcodes role='user' and ignores metadata for role, so this cannot be
      // used to self-assign super_admin.
      data: { full_name: parsed.data.fullName },
    },
  });

  if (error) {
    // Server log only — the browser keeps the generic message.
    console.error("[auth] signUp failed:", error.message);
    if (error.message.toLowerCase().includes("already registered")) {
      return { success: false, error: "auth.invalidCredentials" };
    }
    return { success: false, error: "error.generic" };
  }

  // When email confirmation is enabled Supabase returns a user with no session.
  const needsConfirmation = !data.session;

  if (data.user) {
    await recordAudit({
      userId: data.user.id,
      actorEmail: data.user.email ?? null,
      action: "USER_CREATED",
      entityType: "auth",
    });
  }

  // Ensure newly registered account is NOT automatically logged in:
  // User must visit the login page and authenticate with email and password.
  if (data.session) {
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    data: { needsConfirmation },
    message: needsConfirmation
      ? "auth.registerSuccess"
      : "auth.registerSuccessNoConfirm",
  };
}

export async function logoutAction(): Promise<void> {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  await supabase.auth.signOut();

  if (profile) {
    await recordAudit({
      userId: profile.id,
      actorEmail: profile.email,
      action: "LOGOUT",
      entityType: "auth",
    });
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function forgotPasswordAction(
  input: unknown,
): Promise<ActionResult> {
  // Limits both email-bombing of a victim and enumeration probing.
  const ip = await getClientIp();
  if (!rateLimit(`forgot:${ip}`, 5, 15 * 60_000).ok) {
    return { success: false, error: "error.rateLimited" };
  }

  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "validation.email",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reset-password`,
  });

  // Always report success, whatever the outcome. Reporting "no such user" here
  // would turn this endpoint into an account-enumeration oracle.
  return { success: true, data: undefined, message: "auth.resetSent" };
}

export async function resetPasswordAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "validation.passwordMin",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  // The recovery link establishes a session before this runs; without one there
  // is nothing to update and the request is rejected.
  const userId = await getAuthedUserId();
  if (!userId) return { success: false, error: "error.sessionExpired" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) return { success: false, error: "error.generic" };

  await recordAudit({
    userId,
    actorEmail: null,
    action: "USER_UPDATED",
    entityType: "auth",
    metadata: { field: "password" },
  });

  return { success: true, data: undefined, message: "auth.passwordUpdated" };
}
