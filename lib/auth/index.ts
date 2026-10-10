import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types";

/**
 * Server-side authorization helpers.
 *
 * Rule: never trust a user id supplied by the client. Every ownership check
 * derives the id from the verified Supabase session obtained here.
 *
 * These complement (never replace) the RLS policies in the database.
 */

/**
 * Returns the verified auth user, or null.
 * `cache` de-duplicates the call across a single render pass.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
});

/** Returns the current user's profile row (role, language, theme…), or null. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (data) return data as Profile;

  // Auto-backfill: if the row doesn't exist yet, attempt to create it.
  // Allowed by RLS policy "profiles_insert_own" (0002_rls_policies.sql).
  if (!data) {
    try {
      const fullName =
        (user.user_metadata?.full_name as string | undefined)?.trim() ||
        user.email?.split("@")[0] ||
        "User";

      const { data: inserted, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email ?? "",
          full_name: fullName,
          role: "user",
        })
        .select("*")
        .maybeSingle();

      if (!insertError && inserted) {
        // Also ensure default notification preferences exist
        await supabase
          .from("notification_preferences")
          .insert({ user_id: user.id })
          .maybeSingle();

        return inserted as Profile;
      }
    } catch (backfillErr) {
      console.error("[auth] Profile auto-backfill threw:", backfillErr);
    }
  }

  if (error) {
    console.error("[auth] getCurrentProfile error:", error.message);
  }

  return null;
});

export async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile?.role === "super_admin";
}

export async function getUserRole(): Promise<UserRole | null> {
  const profile = await getCurrentProfile();
  return profile?.role ?? null;
}

/**
 * Guards a page/action that requires a signed-in user.
 * Redirects to /login (preserving intent) when there is no session.
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Guards a page/action that requires a profile row to exist. */
export async function requireProfile(): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();
  if (!profile) {
    // If authenticated user has no profile (e.g. database schema not initialized),
    // redirecting to /login causes an infinite redirect loop with middleware.
    redirect("/unauthorized?error=profile_not_found");
  }
  return profile;
}

/**
 * Guards Super Admin surfaces.
 * A signed-in non-admin is sent to /unauthorized rather than /login, so we
 * don't imply that re-authenticating would grant access.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "super_admin") redirect("/unauthorized");
  return profile;
}

/**
 * Non-redirecting variants for use inside Server Actions, which should return
 * a structured error instead of throwing a navigation.
 */
export async function getAuthedUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

export async function assertMeterOwnership(
  meterId: string,
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const userId = await getAuthedUserId();
  if (!userId) return { ok: false, error: "Not authenticated" };

  const supabase = await createClient();
  // RLS already restricts this SELECT to the caller's rows; the explicit
  // user_id filter is a second, independent barrier.
  const { data, error } = await supabase
    .from("meters")
    .select("id")
    .eq("id", meterId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return { ok: false, error: "Meter not found" };
  return { ok: true, userId };
}
